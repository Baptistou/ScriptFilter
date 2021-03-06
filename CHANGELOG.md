﻿# ScriptFilter 4.1 - CHANGELOG

**version 4.1 (14/07/2018)**
- Add CSP option to block third-party and allow unsafe inline resources.
- Add CSP directive "font-src" with directive "style-src".
- Update some i18n translations.
- Remove deprecated CSP Level 2 directive "child-src".

**version 4.0 (09/06/2018)**
- Fix domain url matching issue with wildcard urls and non http urls.
- Fix some minor issues.
- Add new design in Settings page.
- Add new features to action menu in Settings page.
- Add information slideshow to "About" block in Settings page.
- Add select menu to export blacklist as text file or CSV file.
- Add light & dark themes.
- Add user interface persistence.
- Improve error message when file import fails.
- Update some i18n translations.
- Remove footer from Settings page.
- Code and performance improvements.

**version 3.2 (30/03/2018)**
- Fix CSP All select issue in Settings page.
- Prevent some potential issues in functions.js.
- Code improvements.

**version 3.1 (25/03/2018)**
- Fix CSP sandbox invalid option.
- Fix error on file import when no file is selected.
- Update some i18n translations.
- CSS responsive improvements for large screens.
- Icon font improvements for Windows and Linux.
- Code and performance improvements.

**version 3.0 (12/01/2018)**
- Add File section in Settings page.
- Add domain blacklist import from text file.
- Add domain blacklist export to text file.
- Add domain blacklist clear function.
- Modify the validation of input/imported domain urls with strict rule match and lower case conversion.
- Code improvements.

**version 2.1 (04/01/2018)**
- Fix compatibility issue with Chromium PDF Viewer Plugin not working with CSP sandbox.
- Fix compatibility issue with Firefox not opening Google links with CSP sandbox.

**version 2.0 (02/01/2018)**
- Fix issue with CSP not applying on Settings page if its tab url was modified.
- Fix issue with duplicate matching rules in blacklist which could prevent CSP to switch OFF.
- Fix compatibility issue with child-src/frame-src/worker-src in CSP level 1, 2 and 3.
- Fix compatibility issue with Chromium PDF Viewer Plugin not working with CSP sandbox.
- Add internationalization with i18n API.
- Add French, Italian and Spannish translations.
- Add a new option to add ScriptFilter to page context menu (no Firefox Android support).
- Add Settings to browserAction context menu for Firefox 53+.
- Add colors to CSP list items.
- Add alert messages for adding/removing urls in Domain Blacklist section.
- Modify the appearance of Settings page with two sections Settings and Domain Blacklist.
- CSS responsive improvements for mobile display.
- Code and performance improvements.

**version 1.0 (22/11/2017)**
- First version :)

*Designed by Baptiste Thémine*
