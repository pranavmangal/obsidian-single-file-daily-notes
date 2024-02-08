import {
	App,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TAbstractFile,
	TFile,
	TFolder,
	moment,
} from "obsidian";

interface SingleFileDailyNotesSettings {
	noteName: string;
	noteLocation: string;
	headingType: string;
	dateFormat: string;
}

const DEFAULT_SETTINGS: SingleFileDailyNotesSettings = {
	noteName: "Daily Notes",
	noteLocation: "",
	headingType: "h3",
	dateFormat: "DD-MM-YYYY, dddd",
};

const DEFAULT_DUMMY_ENTRY = "- entry";

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
		// Add file open listener for updating daily notes file
		this.app.workspace.on("file-open", this.onFileOpen.bind(this));

		// Add rename listener for updating settings
		this.app.vault.on("rename", this.onRename.bind(this));
	}

	// ------------------------------------------------------------------------

	/**
	 * Updates the settings to reflect new daily notes file name or path
	 * @param file - renamed file or folder
	 * @param oldPath - old path of renamed entity
	 */
	async onRename(file: TAbstractFile, oldPath: string) {
		const currentPath = getDailyNotesFilePath(this.settings);

		if (file instanceof TFile && oldPath == currentPath) {
			this.settings.noteName = file.basename;
		}

		if (file instanceof TFolder && currentPath.startsWith(oldPath)) {
			const newPath = file.path + currentPath.substring(oldPath.length);
			const justPath = newPath.substring(0, newPath.lastIndexOf("/"));
			this.settings.noteLocation = justPath;
		}

		await this.saveSettings();
	}

	/**
	 * Updates the daily notes file if it is opened
	 * @param file - opened file
	 */
	async onFileOpen(file: TFile) {
		if (file && file.path == getDailyNotesFilePath(this.settings)) {
			await this.updateDailyNote(file);
			await this.positionCursor(file);
		}
	}

	// ------------------------------------------------------------------------

	/**
	 * Tries to intelligently position the cursor in the daily notes file
	 * @param file - daily notes file
	 */
	async positionCursor(file: TFile) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			const fileContent = await this.app.vault.read(file);
			const lines = fileContent.split("\n");

			// Skip to today's section
			let i = 0;
			while (!lines[i].startsWith(this.getTodayHeading())) {
				i++;
			}

			// Move to the first line of today's section
			i++;

			if (lines[i] == DEFAULT_DUMMY_ENTRY) {
				// Select the dummy entry
				view.editor.setSelection(
					{ line: i, ch: 2 },
					{ line: i, ch: lines[i].length }
				);
			} else {
				// Move cursor to the end of today's section
				while (!lines[i].startsWith(getHeadingMd(this.settings))) {
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
		if (this.settings.noteName == "") {
			new Notice(
				"Daily notes file name cannot be empty. Change this in the plugin settings."
			);
			return;
		}

		const filePath = getDailyNotesFilePath(this.settings);

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

	/**
	 * Returns updated daily notes file
	 * @param data - current daily notes file
	 * @returns upated daily notes file
	 */
	updatedNote(data: string): string {
		const lines = data.split("\n");

		const todayHeading = this.getTodayHeading();
		const hasTodaySection = lines.some((line) =>
			line.startsWith(todayHeading)
		);

		if (!hasTodaySection) {
			let updatedFile = data;

			if (moment().date() == 1) {
				const monthSection =
					"\n---\n" +
					"#".repeat(getHeadingLevel(this.settings) - 1) +
					" " +
					moment().subtract(1, "day").format("MMMM YYYY") +
					"\n";

				updatedFile = monthSection + updatedFile;
			}

			const todaySection =
				todayHeading + "\n" + DEFAULT_DUMMY_ENTRY + "\n";
			updatedFile = todaySection + updatedFile;

			return updatedFile;
		}

		return data;
	}

	// ------------------------------------------------------------------------

	/**
	 * Generates the heading for a daily note section with today's date
	 */
	getTodayHeading(): string {
		return (
			getHeadingMd(this.settings) +
			" " +
			moment().format(this.settings.dateFormat)
		);
	}

	// ------------------------------------------------------------------------

	onunload() {
		this.app.workspace.off("file-open", this.onFileOpen);
		this.app.vault.off("rename", this.onRename);
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
			.setName("Heading type for daily note sections")
			.setDesc(
				"Provide the type of heading that should be used for a daily note section (h1 to h6)"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter the heading type")
					.setValue(this.plugin.settings.headingType.toString())
					.onChange(
						this.debounce(async (value: string) => {
							const headingRegex = /^h[1-6]$/;
							if (!headingRegex.test(value)) {
								new Notice(
									`Invalid heading type entered: "${value}"` +
										"\nPlease fix this in the plugin settings."
								);
								return;
							} else {
								this.plugin.settings.headingType = value;
								await this.plugin.saveSettings();

								this.updateHeadings(value);
							}
						}, 400)
					)
			);

		const dateFormatSettingDescription = new DocumentFragment();
		dateFormatSettingDescription.createEl("span", {
			text: "Provide a custom ",
		});
		dateFormatSettingDescription.appendChild(
			createEl("a", {
				text: "moment.js compatible",
				href: "https://momentjs.com/docs/#/parsing/string-format/",
			})
		);
		dateFormatSettingDescription.appendText(
			" format string for using a different date format"
		);

		new Setting(containerEl)
			.setName("Date format for daily note headings")
			.setDesc(dateFormatSettingDescription)
			.addText((text) =>
				text
					.setPlaceholder("Enter the format string")
					.setValue(this.plugin.settings.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateFormat = value;
						await this.plugin.saveSettings();
					})
			);
	}

	updateHeadings(value: string) {
		const filePath = getDailyNotesFilePath(this.plugin.settings);

		let file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			this.app.vault.process(file, (data) => {
				let lines = data.split("\n");

				const dateFormat = this.plugin.settings.dateFormat;
				const dateHeadingRegex = /^(#{1,6}) (.*)/;
				const newHeading = getHeadingMd(this.plugin.settings);

				for (const [i, line] of lines.entries()) {
					const match = dateHeadingRegex.exec(line);
					if (match && moment(match[2], dateFormat, true).isValid()) {
						lines[i] = line.replace(match[1], newHeading);
					}
				}

				return lines.join("\n");
			});

			new Notice(`Updated daily note headings to ${value}`);
		}
	}

	// ------------------------------------------------------------------------

	debounce(func: Function, wait: number) {
		let timeout: ReturnType<typeof setTimeout>;

		return function executedFunction(...args: any) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};

			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}
}

// Utility functions

/**
 * Returns the path for the daily notes file for the given settings
 * @param settings
 * @returns string - the path of the daily notes file
 */
const getDailyNotesFilePath = (settings: SingleFileDailyNotesSettings) => {
	const file = settings.noteName + ".md";

	if (settings.noteLocation == "") {
		return file;
	} else {
		return settings.noteLocation + "/" + file;
	}
};

const getHeadingLevel = (settings: SingleFileDailyNotesSettings) => {
	return parseInt(settings.headingType[1]);
};

const getHeadingMd = (settings: SingleFileDailyNotesSettings) => {
	return "#".repeat(getHeadingLevel(settings));
};
