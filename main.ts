import {
	App,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	moment,
} from "obsidian";

interface SingleFileDailyNotesSettings {
	noteName: string;
	noteLocation: string;
	hLevel: number;
}

const DEFAULT_SETTINGS: SingleFileDailyNotesSettings = {
	noteName: "Daily Notes",
	noteLocation: "",
	hLevel: 5,
};

export default class SingleFileDailyNotes extends Plugin {
	settings: SingleFileDailyNotesSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SingleFileDailyNotesSettingTab(this.app, this));

		// --------------------------------------------------------------------
		// Add command palette action to open/create daily notes file

		this.addCommand({
			id: "open-daily-notes",
			name: "Open daily notes",
			callback: () => {
				this.openOrCreateDailyNotesFile();
			},
		});

		// --------------------------------------------------------------------
		// Add ribbon button to open/create daily notes file

		this.addRibbonIcon("calendar-days", "Open daily notes", () => {
			this.openOrCreateDailyNotesFile();
		});

		// --------------------------------------------------------------------
		// Add file listener for updating daily notes file

		this.app.workspace.on("file-open", this.onFileOpen.bind(this));
	}

	// ------------------------------------------------------------------------

	/**
	 * Updates the daily notes file if it is opened
	 * @param file - opened file
	 */
	async onFileOpen(file: TFile) {
		if (file && file.name == `${this.settings.noteName}.md`) {
			await this.updateDailyNote(file);
			await this.positionCursor(file);
		}
	}

	async positionCursor(file: TFile) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			const fileContent = await this.app.vault.read(file);
			const lines = fileContent.split("\n");

			let i = 0;
			while (!lines[i].startsWith("-")) {
				i++;
			}

			if (lines[i] == "- entry") {
				// Select the dummy entry
				view.editor.setSelection(
					{ line: i, ch: 2 },
					{ line: i, ch: lines[i].length }
				);
			} else {
				// Move cursor to the end of today's daily notes
				while (lines[i].trimStart().startsWith("-")) {
					i++;
				}

				view.editor.setCursor(i - 1, lines[i - 1].length);
			}
		}
	}

	// ------------------------------------------------------------------------

	/**
	 * Opens daily notes file and creates one if it doesn't exist
	 */
	async openOrCreateDailyNotesFile() {
		const path = this.settings.noteLocation;
		const fileName = this.settings.noteName;

		if (fileName == "") {
			new Notice(
				"Daily notes file name cannot be empty. Change this in the plugin settings."
			);
			return;
		}

		const filePath =
			path == "" ? `${fileName}.md` : `${path}\/${fileName}.md`;

		let file = this.app.vault.getAbstractFileByPath(filePath);
		if (!file) {
			file = await this.app.vault.create(filePath, "");
		}

		if (file instanceof TFile) {
			await this.app.workspace.getLeaf().openFile(file);
		}
	}

	// ------------------------------------------------------------------------

	/**
	 * Updates the daily notes file with today's note
	 * @param file - daily notes file to update
	 */
	async updateDailyNote(file: TFile) {
		return this.app.vault.process(file, (data) => {
			return this.updatedNote(data);
		});
	}

	// ------------------------------------------------------------------------

	/**
	 * Returns updated daily notes file
	 * @param data - current daily notes file
	 * @returns upated daily notes file
	 */
	updatedNote(data: string): string {
		const lines = data.split("\n");
		const hLevel = this.settings.hLevel;

		const todayHeading =
			"#".repeat(hLevel) + " " + moment().format("DD-MM-YYYY, dddd");

		const hasTodaySection = lines.some((line) =>
			line.startsWith(todayHeading)
		);

		if (!hasTodaySection) {
			let updatedFile = data;

			if (moment().date() == 1) {
				const monthSection =
					"\n---\n" +
					"#".repeat(hLevel - 1) +
					" " +
					moment().subtract(1, "day").format("MMMM YYYY") +
					"\n";

				updatedFile = monthSection + updatedFile;
			}

			const todaySection = todayHeading + "\n" + "- entry" + "\n";
			updatedFile = todaySection + updatedFile;

			return updatedFile;
		}

		return data;
	}

	// ------------------------------------------------------------------------

	onunload() {
		this.app.workspace.off("file-open", this.onFileOpen);
	}

	// ------------------------------------------------------------------------

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SingleFileDailyNotesSettingTab extends PluginSettingTab {
	plugin: SingleFileDailyNotes;

	constructor(app: App, plugin: SingleFileDailyNotes) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h2", { text: this.plugin.manifest.name });

		new Setting(containerEl)
			.setName("Name for daily notes file")
			.setDesc("Provide a custom name for the daily notes file")
			.addText((text) =>
				text
					.setPlaceholder("Enter the file name")
					.setValue(this.plugin.settings.noteName)
					.onChange(async (value) => {
						this.plugin.settings.noteName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Location of daily notes file")
			.setDesc(
				"Provide a path where you want the daily notes file to live (leave empty for root)"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter the path")
					.setValue(this.plugin.settings.noteLocation)
					.onChange(async (value) => {
						this.plugin.settings.noteLocation = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Heading level of daily note sections")
			.setDesc(
				"Provide the type of heading that should be used for a daily note (between 1 to 6)"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter the heading level")
					.setValue(this.plugin.settings.hLevel.toString())
					.onChange(async (value) => {
						this.plugin.settings.hLevel = parseInt(value);
						await this.plugin.saveSettings();
					})
			);
	}
}
