# Single File Daily Notes

An Obsidian plugin for creating and managing daily notes in a single file.

<img width="755" alt="showcase" src="https://github.com/pranavmangal/obsidian-single-file-daily-notes/assets/46976109/aa344557-7e4c-4c66-a168-e440c47463c6">

## Features

### Create and manage daily notes

The plugin will create a new note for today automatically and select the dummy entry for immediate editing. If today's note already exists, it will try to position the cursor for appending/editing the existing note.

<img width="500" alt="editing" src="https://github.com/pranavmangal/obsidian-single-file-daily-notes/assets/46976109/182b10f7-5360-454f-9879-4f6bbcd7f33f">

The result is a single standard Markdown file:
```md
#### 02-01-2024, Tuesday
-   entry
#### 01-01-2024, Monday
-   Started planning for Q1 goals
-   Cleaned up the store room, needed to make space for the new suitcase
-   Read a few more chapters of [[The Dark Forest]]
```

### See an outline view
Since daily notes are formed by using standard Mardown headings, Obsidian's built-in outline view can be used to browse through them.
<img width="890" alt="outline" src="https://github.com/pranavmangal/obsidian-single-file-daily-notes/assets/46976109/031a2bb2-2d14-4c69-ae26-a3708f55ec42">

### Configurability
You are able to configure:
-   The name for the daily notes file
-   The location of file
-   The type of headings used for daily notes
-   The date format used for daily notes

## Installation
Currently, the plugin can be installed via [BRAT](https://github.com/TfTHacker/obsidian42-brat)

## Usage
-   Open the plugin settings to configure it to your preferences
-   Click on the ribbon icon or select "Open daily notes" via the command palette (`⌘ + P`) to create the daily notes file.
-   Once created, the file can be opened like a regular file, via the ribbon icon or the command palette.
-   Start editing!

## Why
The in-built daily notes system in Obsidian is pretty decent, however it works by creating a separate file for each note. There are plugins to better manage these notes and display them in different views, but they still don't change the underlying file structure.

I didn't want hundreds of files in my vault dedicated to these daily notes, especially when they were quite small individually, which is why this plugin was created.
