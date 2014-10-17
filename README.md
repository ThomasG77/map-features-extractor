# Map Features Extractor (MFE)

The goal of the project is mainly: 
* to make simple helpers to be able to extract data content from various
  mapping JavaScript API. Nowadays, those API are like small silos for data.
  When you want to reuse geo content using other API, you are stuck.
* to get simple informations like extent and map center in different
  projections from the application you browse

We started working to support Leaflet, OpenLayers 3 and Google Maps.
It's an early stage project. You can always extract helpers for your use cases.

We mainly want to use GeoJSON as the Lingua Franca for extraction.
Other formats may be supported in the future.

Be aware that you are responsible if you use proprietary data from projects
using the supported Open Source JavaScript API.