import Twig from "twig"
import { join, resolve, dirname } from "node:path"
import { existsSync, readdirSync } from "node:fs"
import { normalizePath } from "vite"

const { twig } = Twig

const FRAMEWORK_REACT = "react"
const FRAMEWORK_HTML = "html"

const defaultOptions = {
  namespaces: {},
  filters: {},
  functions: {},
  globalContext: {},
  framework: FRAMEWORK_HTML,
  pattern: /\.(twig)(\?.*)?$/,
}
Twig.cache(false)

const includeTokenTypes = [
  "Twig.logic.type.embed",
  "Twig.logic.type.include",
  "Twig.logic.type.extends",
  "Twig.logic.type.import",
]

const findInChildDirectories = (directory, component) => {
  const files = readdirSync(directory, { recursive: true })
  for (const file of files) {
    const filePath = join(directory, file)
    if (file.endsWith(`/${component}.twig`)) {
      return filePath
    }
  }

  return null
}

const resolveFile = (directory, file) => {
  const filesToTry = [file, `${file}.twig`, `${file}.html.twig`]
  for (const ix in filesToTry) {
    const path = resolve(filesToTry[ix])
    if (existsSync(path)) {
      return normalizePath(path)
    }
    const withDir = resolve(directory, filesToTry[ix])
    if (existsSync(withDir)) {
      return normalizePath(withDir)
    }
  }

  return normalizePath(resolve(directory, file))
}

const pluckIncludes = (tokens) => {
  return [
    ...tokens
      .filter((token) => includeTokenTypes.includes(token.token?.type))
      .reduce(
        (carry, token) => [
          ...carry,
          ...token.token.stack.map((stack) => stack.value),
        ],
        []
      ),
    ...tokens.reduce(
      (carry, token) => [...carry, ...pluckIncludes(token.token?.output || [])],
      []
    ),
  ].filter((value, index, array) => {
    return array.indexOf(value) === index
  })
}

const resolveNamespaceOrComponent = (namespaces, template) => {
  let resolveTemplate = template
  const isNamespace = template.includes(":")

  // Support for SDC.
  if (isNamespace) {
    const [namespace, component] = template.split(":")
    resolveTemplate = `@${namespace}/${component}/${component}`
  }
  let expandedPath = Twig.path.expandNamespace(namespaces, resolveTemplate)

  // If file not found and we are in namespace -> search deeper.
  if (!existsSync(expandedPath) && isNamespace) {
    const [namespace, component] = template.split(":")
    let foundFile = findInChildDirectories(namespaces[namespace], component)
    if (existsSync(foundFile)) {
      expandedPath = foundFile
    }
  }

  return expandedPath
}

const compileTemplate = (id, file, { namespaces }) => {
  return new Promise((resolve, reject) => {
    const options = { namespaces, rethrow: true, allowInlineIncludes: true }
    twig({
      id,
      path: file,
      error: reject,
      allowInlineIncludes: true,
      load(template) {
        if (typeof template.tokens === "undefined") {
          reject("Error compiling twig file")
          return
        }
        resolve({
          includes: pluckIncludes(template.tokens),
          code: template.compile(options),
        })
      },
    })
  })
}

Twig.cache(false)

const errorHandler =
  (id, isDefault = true) =>
  (e) => {
    if (isDefault) {
      return {
        code: `export default () => 'An error occurred whilst rendering ${id}: ${e.toString()} ${
          e.stack
        }';`,
        map: null,
      }
    }
    return {
      code: null,
      map: null,
    }
  }

const plugin = (options = {}) => {
  options = { ...defaultOptions, ...options }
  return {
    name: "vite-plugin-twig-drupal",
    config: ({ root }) => {
      if (!options.root) {
        options.root = root
      }
    },
    async shouldTransformCachedModule(src, id) {
      return options.pattern.test(id)
    },
    async transform(src, id) {
      if (options.pattern.test(id)) {
        let frameworkInclude = ""
        let frameworkTransform = "const frameworkTransform = (html) => html;"

        let asTwigJs = id.match(/\?twig$/)

        if (options.framework === FRAMEWORK_REACT && !asTwigJs) {
          frameworkInclude = `import React from 'react'`
          frameworkTransform = `const frameworkTransform = (html) => React.createElement('div', {dangerouslySetInnerHTML: {'__html': html}});;`
        }

        if (asTwigJs) {
          // Tidy up file path by remove ?twig
          id = id.slice(0, -5)
        }

        let embed,
          embeddedIncludes,
          functions,
          code,
          includes,
          seen = []

        try {
          const result = await compileTemplate(id, id, options).catch(
            errorHandler(id)
          )
          if ("map" in result) {
            // An error occurred.
            return result
          }
          code = result.code
          includes = result.includes
          const includePromises = []
          const processIncludes = (template) => {
            const file = resolveFile(
              dirname(id),
              resolveNamespaceOrComponent(options.namespaces, template)
            )
            if (!seen.includes(template)) {
              includePromises.push(
                new Promise(async (resolve, reject) => {
                  const { includes, code } = await compileTemplate(
                    template,
                    file,
                    options
                  ).catch(errorHandler(template, false))
                  if (includes) {
                    includes.forEach(processIncludes)
                  }
                  resolve(code)
                })
              )
              seen.push(template)
            }
          }
          includes.forEach(processIncludes)
          embed = includes
            .filter((template) => template !== "_self")
            .map(
              (template) =>
                `import '${resolveFile(
                  dirname(id),
                  resolveNamespaceOrComponent(options.namespaces, template)
                )}';`
            )
            .join("\n")

          functions = Object.entries(options.functions)
            .map(([name, value]) => {
              return `
              const ${name} = ${value};
              ${name}(Twig);
            `
            })
            .join("\n")

          const includeResult = await Promise.all(includePromises).catch(
            errorHandler(id)
          )
          if (!Array.isArray(includeResult) && "map" in includeResult) {
            // An error occurred.
            return includeResult
          }
          embeddedIncludes = includeResult.reverse().join("\n")
        } catch (e) {
          return errorHandler(id)(e)
        }
        const output = `
        import Twig, { twig } from 'twig';
        import DrupalAttribute from 'drupal-attribute';
        import { addDrupalExtensions } from 'drupal-twig-extensions/twig';
        ${frameworkInclude}

        ${embed}

        ${functions}

        addDrupalExtensions(Twig);

        // Disable caching.
        Twig.cache(false);


        ${embeddedIncludes};
        ${frameworkTransform};
        export default (context = {}) => {
          const component = ${code}
          ${includes ? `component.options.allowInlineIncludes = true;` : ""}
          try {
            let defaultAttributes = context.defaultAttributes ? context.defaultAttributes : [];
            if (!Array.isArray(defaultAttributes)) {
              // We were passed a map, turn it into an array.
              defaultAttributes = Object.entries(defaultAttributes);
            }
            return frameworkTransform(component.render({
              attributes: new DrupalAttribute(defaultAttributes),
              ...${JSON.stringify(options.globalContext)},
              ...context
            }));
          }
          catch (e) {
            return frameworkTransform('An error occurred whilst rendering ${id}: ' + e.toString());
          }
        }`
        return {
          code: output,
          map: null,
          dependencies: seen,
        }
      }
    },
  }
}

export default plugin
