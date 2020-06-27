## Table of contents
* [Introduction](#introduction)
* [Technologies](#technologies)
* [Setup](#setup)

## Introduction
The project presents a method for the web-based visualization of 3D models of civil structures for optimizing dynamic and complex processes in Lifecycle Asset Management. The prototype is developed on the basis of WebGL, a technology for web rendering of interactive 3D graphics and animations supported by all modern web browsers.

The created viewer presents the 3D model of Queen's Bridge in Rotterdam. In order to illustrate the surrounding area of the bridge, a 2D base map is added by attaching a plane to the 3D model and adding an image of the surrounding area as texture of the plane. The visibility of the base map is handled by a toggle button on the top of the viewer. For an easier navigation and more user-friendly interface, the 3D viewer is structured in several parts.

When an element in the model is selected, a popup window appears in the upper right corner to show additional information about the selected object, such as civil structure type, object name, inspection date, inspector, and notes. 

For a better interaction with the 3D model, collapsible menus with a legend, switcher, and history are added to the upper left corner of the 3D viewer. The legend aims to explain the inspection scores and illustrate the colors assigned to them. The switcher is represented in the form of check boxes and the user can choose which elements in the 3D model should be shown in the viewer for further investigation. The historical data menu shows previous results from the bridge inspections, i.e. the distinct elements in the 3D model change their colours dynamically according to the inspection scores when the user selects a year.

Due to the large size of the 3D model and longer load times, a progress bar is added on the bottom of the viewer. 

## Technologies
The frameworks used in the project are:
* HTML
* CSS
* Bootstrap
* JavaScript
* Three.js
* Node.js

## Setup
To run this project, download the zip file and save it locally. After unpacking the file, direct to the root of the project in the terminal:

```
$ cd ../3d-bim-models-threejs
```

Then, install the dependencies and start the project by running the following commands:
```
$ npm install
$ npm start
```

Open a web browser (e.g. Google Chrome) and go to http://localhost:5000/ to see the 3D viewer.
