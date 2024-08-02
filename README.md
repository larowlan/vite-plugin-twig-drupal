<div align="center">
<h1>Vite Plugin Twig Drupal</h1>

  <img
    height="143"
    width="200"
    alt="goat"
    src="https://twig.symfony.com/images/logo.png"
  />


<p>A Vite plugin that handles transforming twig files into a Javascript function that can be used with Storybook.</p>

<br />
</div>

<hr />

<!-- prettier-ignore-start -->
[![Build status](https://github.com/larowlan/vite-plugin-twigdrupal/actions/workflows/node.js.yml/badge.svg)](https://github.com/larowlan/vite-plugin-twig-drupal/actions/workflows/node.js.yml)
[![version][version-badge]][package] [![downloads][downloads-badge]][npmtrends]
[![MIT License][license-badge]][license]
[![PRs Welcome][prs-badge]][prs] 

[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]
[![Tweet][twitter-badge]][twitter]
<!-- prettier-ignore-end -->

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [The problem](#the-problem)
- [This solution](#this-solution)
- [Installation](#installation)
- [Examples](#examples)
- [Usage with React](#usage-with-react)
- [Issues](#issues)
  - [🐛 Bugs](#-bugs)
  - [💡 Feature Requests](#-feature-requests)
  - [❓ Questions](#-questions)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## The problem

You are working with Twig in a styleguide-driven-development process. You are writing isolated components
that consist of css, twig and Javascript.
You want to be able to use twig to render your components for [Storybook](https://storybook.js.org).
You want fast refresh with Vite.
You want Twig embeds, includes and extends to work.
You want to use Drupal specific twig features like create_attributes etc. 

## This solution

The `Vite plugin Twig Drupal` is a Vite plugin based on [Twig JS](https://github.com/twigjs/twig.js) for
compiling Twig-based components into a Javascript function so that they can be used as components with Storybook.
It allows you to import twig files into your story as though they are Javascript files.

### Comparison to other solutions.

* [Vite plugin twig loader](https://github.com/dark-kitt/vite-plugin-twig-loader) Doesn't handle nested includes/embeds/extends. These are a fairly crucial feature of twig when building a component library as they allow re-use and DRY principles
* [Components library server](https://www.drupal.org/project/cl_server) Requires you to have a running Drupal site. Whilst this ensures your twig output is identical to that of Drupal (because Drupal is doing the rendering), it is a bit more involved to setup. If you're going to use [single directory components](https://www.drupal.org/project/cl_components) or a similar Drupal module like [UI patterns](https://www.drupal.org/project/ui_patterns) then this may be a better option for you.

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `devDependencies`:

```
npm install --save-dev vite-plugin-twig-drupal
```

You then need to configure your vite.config.js.

```javascript
import { defineConfig } from "vite"
import twig from 'vite-plugin-twig-drupal';
import { join } from "node:path"

export default defineConfig({
  plugins: [
    // Other vite plugins.
    twig({
      namespaces: {
        components: join(__dirname, "/path/to/your/components"),
        // Other namespaces as required.
      },
      // Optional if you are using React storybook renderer. The default is 'html' and works with storybook's html
      // renderer.
      // framework: 'react'
      functions: {
        // You can add custom functions - each is a function that is passed the active Twig instance and should call
        // e.g. extendFunction to register a function
        reverse: (twigInstance) => twigInstance.extendFunction("reverse", () => (text) => text.split(' ').reverse().join(' ')),
        // e.g. extendFilter to register a filter
        clean_unique_id: (twigInstance) => twigInstance.extendFilter("clean_unique_id", () => (text) => text.split(' ').reverse().join(' ')),
      },
      globalContext: {
        // Global variables that should be present in all templates.
        active_theme: 'my_super_theme',
        is_front_page: false,
      },
    }),
    // Other vite plugins.
  ],
})
```

With this config in place you should be able to import twig files into your story files.

## Examples

```javascript
// stories/Button.stories.js

// Button will be a Javascript function that accepts variables for the twig template.
import Button from './button.twig';

// Import stylesheets, this could be a sass or postcss file too.
import './path/to/button.css';
// You may also have JavaScript for the component.
import './path/to/some/javascript/button.js';

export default {
  title: 'Components/Button',
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: { type: 'text' },
    },
    modifier: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary'],
    },
  },
  // Just pass along the imported variable.
  component: Button,
};

// Set default variables in the story.
export const Default = {
  args: { title: 'Click me' },
};

export const Primary = {
  args: { title: 'Click me', modifier: 'primary' },
};

// Advanced example.
export const ButtonStrip = {
  name: 'Button group',
  render: () => `
    ${Button({title: 'Button 1', modifier: 'primary'})} 
    ${Button({title: 'Button 2', modifier: 'secondary'})}
  `
}
```

## Usage with React

When adding `framework: 'react'` to vite.config.js twig files will output React JSX functions
that can be used inside a React Storybook instance.

This way Twig components can be rendered alongside React components.

However, you will need to revert to a straight TwigJS function import so you can nest Twig components
inside other Twig components. In these instances append `?twig` to your component import. This will return a JavaScript function instead of a React component.
When nesting 
Twig components inside React components this is not needed. Nesting React components inside Twig components
does not work currently.

```javascript
import Button from './button.twig';
import OtherComponent from ../other-component.twig?twig

export default {
  title: 'Components/Button',
  tags: ['autodocs'],
  args: {
    // Render by calling the component as a function.
    // You can pass any variables down as an object.
    otherComponent: OtherComponent(),
  },
  component: Button,
};

```

## Issues

### 🐛 Bugs

Please file an issue for bugs, missing documentation, or unexpected behavior.

[**See Bugs**][bugs]

### 💡 Feature Requests

Please file an issue to suggest new features. Vote on feature requests by adding
a 👍. This helps maintainers prioritize what to work on.

[**See Feature Requests**][requests]

### ❓ Questions

For questions related to using the library, please visit a support community
instead of filing an issue on GitHub.

- [Drupal Slack #frontend channel](https://drupal.org/slack)

## LICENSE

[MIT](LICENSE)

<!-- prettier-ignore-start -->

[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[version-badge]: https://img.shields.io/npm/v/vite-plugin-twig-drupal.svg?style=flat-square
[package]: https://www.npmjs.com/package/vite-plugin-twig-drupal
[downloads-badge]: https://img.shields.io/npm/dm/vite-plugin-twig-drupal.svg?style=flat-square
[npmtrends]: http://www.npmtrends.com/vite-plugin-twig-drupal
[license-badge]: https://img.shields.io/npm/l/vite-plugin-twig-drupal.svg?style=flat-square
[license]: https://github.com/larowlan/vite-plugin-twig-drupal/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[github-watch-badge]: https://img.shields.io/github/watchers/larowlan/vite-plugin-twig-drupal.svg?style=social
[github-watch]: https://github.com/larowlan/vite-plugin-twig-drupal/watchers
[github-star-badge]: https://img.shields.io/github/stars/larowlan/vite-plugin-twig-drupal.svg?style=social
[github-star]: https://github.com/larowlan/vite-plugin-twig-drupal/stargazers
[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20vite-plugin-twig-drupal%20by%20%40larowlan%20https%3A%2F%2Fgithub.com%2Flarowlan%2Fvite-plugin-twig-drupal%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/github.com/larowlan/vite-plugin-twig-drupal.svg?style=social
[bugs]: https://github.com/larowlan/vite-plugin-twig-drupal/issues?q=is%3Aissue+is%3Aopen+label%3Abug+sort%3Acreated-desc
[requests]: https://github.com/larowlan/vite-plugin-twig-drupal/issues?q=is%3Aissue+sort%3Areactions-%2B1-desc+label%3Aenhancement+is%3Aopen
[good-first-issue]: https://github.com/larowlan/vite-plugin-twig-drupal/issues?utf8=✓&q=is%3Aissue+is%3Aopen+sort%3Areactions-%2B1-desc+label%3A"good+first+issue"+

<!-- prettier-ignore-end -->
