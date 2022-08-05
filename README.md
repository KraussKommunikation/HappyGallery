# HappyGallery

Lightweight lightbox for javascript **to make developers happy :)**

## Installation

Install the latest version using npm:

```
npm install happygallery
```

More installation methods will be added in the future.

## Usage

Import HappyGallery:

```
import HappyGallery from "happygallery";
```

Create the HTML structure:

```html
<div id="my-happygallery">
	<a href="https://picsum.photos/seed/test1/600/400">
		<img title="Test Image 1" alt="image 1 text" src="https://picsum.photos/seed/test1/600/400" />
	</a>
	<a href="https://picsum.photos/seed/test2/600/400">
		<img title="Test Image 2" alt="image 2 text" src="https://picsum.photos/seed/test2/600/400" />
	</a>
	<a href="https://picsum.photos/seed/test3/600/400">
		<img title="Test Image 3" alt="image 3 text" src="https://picsum.photos/seed/test3/600/400" />
	</a>
	<a href="https://picsum.photos/seed/test4/600/400">
		<img title="Test Image 4" alt="image 4 text" src="https://picsum.photos/seed/test4/600/400" />
	</a>
</div>
```

Inside JS, initialize a new HappyGallery instance:

```js
const myGallery = document.querySelector("#my-happygallery");
const myHappyGallery = new HappyGallery(myGallery);
```

For more customization, also pass an options object:

```js
const myGallery = document.querySelector("#my-happygallery");
const myHappyGallery = new HappyGallery(myGallery, {
	itemSelector: "a",
});
```

## Options

|name|type|default value|description
|-|-|-|-|
|observe|boolean|false|Use a MutationObserver to reload the gallery when the DOM is modified|
|updateOpenGalleryOnMutation|boolean|true|*requires observe* Should new items be added to the open gallery|
|itemSelector|selector|"a"|Selector for where to find images. Targeted elements should be an image or contain one|
|slideAnimationDuration|float|0.3|CSS transition duration in seconds|
|toolbar|string[]|["download", "share"]|Array with toolbar buttons that should be visible|
|useNativeShareAIP|boolean|true|*requires toolbar[].sharebutton* Should the share-button use the browsers native share API (if available)|

## Contribute

Thanks for your interest in developing HappyGallery. We're always looking forward to getting more people excited to join our project. Here are few things you should consider when contributing to HappyGallery:

1. Before working on new features, share your idea in the [discussions tab](https://github.com/KraussKommunikation/happygallery/discussions).
2. Always format your code using `npm run format` before creating commits.

## Help & Feedback

If you have any questions, feel free to [ask in discussions](https://github.com/KraussKommunikation/happygallery/discussions). To report bugs, please head over to [issues](https://github.com/KraussKommunikation/happygallery/issues).

## Contributors

Project created and maintained by @lkrauss04, @EinLinuus, made possible by [Krauss Kommunikation GmbH](https://krausskommunikation.de/),
