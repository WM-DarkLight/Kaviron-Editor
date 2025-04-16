### LCARS Interactive Fiction Editor





A browser-based interactive fiction editor styled after Star Trek's LCARS interface. Create branching narrative episodes and multi-episode campaigns with a visual editor, all stored locally in your browser.

## Features

- **Complete Offline Experience**: All data is stored locally in your browser using IndexedDB
- **LCARS-Inspired Interface**: Authentic Star Trek LCARS visual design
- **Episode Editor**:

- Create and edit interactive fiction episodes with branching narratives
- Visual scene builder with easy-to-use interface
- Flow chart visualization of your story structure
- Automatic detection of broken links and unreachable scenes



- **Campaign Editor**:

- Organize multiple episodes into cohesive campaigns
- Set episode order and dependencies
- Define conditions for episode availability using flags
- Set initial state flags for episodes
- Visualize campaign flow with an interactive flow chart



- **Story Tester**: Play through your episodes to test the narrative flow
- **Import/Export**: Share your creations with JSON import/export functionality
- **Auto-save**: Never lose your work with automatic saving
- **Snapshot System**: Restore previous versions of your episodes
- **Debug Tools**: Troubleshoot database issues with the built-in debug panel


## Screenshots














## Getting Started

### System Requirements

- Modern web browser with IndexedDB support (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Not supported in private/incognito browsing mode


### Installation

No installation required! LCARS Interactive Fiction Editor runs entirely in your browser.

1. Visit the application URL
2. The application will initialize and create the necessary database structures
3. Start creating your interactive fiction!


## Usage Guide

### Dashboard

The dashboard is your central hub for managing episodes and campaigns:

- **Episodes Tab**: View, create, edit, test, and delete episodes
- **Campaigns Tab**: View, create, edit, and delete campaigns
- **Import/Export Panel**: Import episodes or campaigns from JSON files, export your work


### Creating an Episode

1. Click "CREATE NEW EPISODE" on the dashboard
2. Fill in the episode metadata (title, author, description, stardate, ship name)
3. Switch to the "Scenes" tab to build your story
4. Add scenes and connect them with choices
5. Use the "Flow Chart" tab to visualize and check your story structure
6. Save your episode


### Scene Builder

The scene builder allows you to create the content and structure of your episode:

- **Scene List**: Shows all scenes in your episode
- **Scene Editor**: Edit the selected scene's content and choices
- **Add Scene**: Create new scenes
- **Add Choice**: Create branching paths from each scene
- **Scene Text**: Write your narrative content with paragraph support


### Testing Your Episode

1. Select an episode from the dashboard
2. Click "TEST" to launch the story tester
3. Navigate through your story by making choices
4. Use the "RESTART" button to start over
5. The "Mission Log" panel shows your path through the story


### Creating a Campaign

1. Click "CREATE NEW CAMPAIGN" on the dashboard
2. Fill in the campaign metadata (title, author, description, version)
3. Switch to the "Episodes" tab to add episodes to your campaign
4. Set the episode order and dependencies
5. Define conditions for episode availability
6. Use the "Flow Chart" tab to visualize your campaign structure


### Campaign Episode Manager

- **Add Episode**: Include existing episodes in your campaign
- **Episode Order**: Arrange episodes in sequence
- **Dependencies**: Set which episodes must be completed before others become available
- **Flag Conditions**: Create complex branching paths based on player choices
- **Initial State**: Set starting flags for each episode


### Import/Export

- **Import**: Load episodes or campaigns from JSON files
- **Export**: Save your work as JSON files to share or back up
- **Backup**: Create a complete backup of all your data
- **Restore**: Recover your data from a backup file


### Settings

Access the settings panel to customize your experience:

- **User Preferences**: Set default author name, ship name, and auto-save interval
- **Debug Mode**: Enable advanced debugging features
- **About**: View application information


## Technical Details

### Data Storage

LCARS Interactive Fiction Editor uses IndexedDB for local storage:

- **Episodes**: Interactive fiction stories with scenes and choices
- **Campaigns**: Collections of episodes with order and conditions
- **Snapshots**: Automatic and manual backups of episodes
- **Settings**: User preferences and application configuration


### Data Structure

#### Episode Format

```json
{
  "id": "episode-id",
  "title": "Episode Title",
  "author": "Author Name",
  "description": "Episode description",
  "stardate": "12345.6",
  "shipName": "USS Enterprise NCC-1701",
  "scenes": {
    "start": {
      "id": "start",
      "title": "Starting Scene",
      "text": ["Paragraph 1", "Paragraph 2"],
      "choices": [
        {
          "text": "Choice text",
          "nextScene": "scene-id"
        }
      ]
    }
  }
}
```

#### Campaign Format

```json
{
  "id": "campaign-id",
  "title": "Campaign Title",
  "author": "Author Name",
  "description": "Campaign description",
  "version": "1.0",
  "episodes": [
    {
      "episodeId": "episode-id",
      "title": "Episode Title",
      "description": "Episode description",
      "order": 1,
      "condition": {
        "previousEpisodeId": "previous-episode-id",
        "flags": {
          "flagName": true
        }
      },
      "initialState": {
        "flags": {
          "flagName": true
        }
      }
    }
  ]
}
```

## Troubleshooting

### Database Issues

If you encounter database problems:

1. Open the Debug Panel from the settings menu
2. Check the database status and connection
3. Use the database tools to test connections or reset the database
4. Download logs for detailed error information


### Common Issues

- **"Database Error" on startup**: Your browser may have restricted storage permissions or be in private browsing mode
- **"Failed to save episode"**: Check browser storage quota and permissions
- **"Broken links" in flow chart**: Some choices point to non-existent scenes
- **"Unreachable scenes"**: Scenes that cannot be reached from the start scene


## Recovery Options

- **Auto-save**: The application automatically saves your work every few seconds
- **Manual snapshots**: Create manual backups of your episodes
- **Recovery panel**: Restore episodes from snapshots if something goes wrong
- **Export/Import**: Regularly export your work as JSON files for safekeeping


## License

This is a fan project and is not affiliated with CBS Studios. LCARS and Star Trek are trademarks of CBS Studios Inc.

## Acknowledgements

- Star Trek and the LCARS interface design created by Michael Okuda
- Built with Next.js, Tailwind CSS, and IndexedDB


---

*"To boldly write what no one has written before."*
