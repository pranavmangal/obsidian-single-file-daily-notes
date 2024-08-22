import { App, moment, TFile } from "obsidian";
import { Moment } from "moment";

import { PluginSettings } from "./settings";
import { FilePosition } from "./types";

/**
 * Returns the path for the daily notes file
 */
export const getDailyNotesFilePath = (settings: PluginSettings) => {
    const file = settings.noteName + ".md";

    if (settings.noteLocation == "") {
        return file;
    } else {
        return settings.noteLocation + "/" + file;
    }
};

/**
 * Returns the daily notes file
 */
export const getDailyNotesFile = (
    app: App,
    settings: PluginSettings,
): TFile | null => {
    const path = getDailyNotesFilePath(settings);
    const file = app.vault.getAbstractFileByPath(path);

    if (file && file instanceof TFile) {
        return file;
    } else {
        return null;
    }
};

/**
 * Returns the level of headingType from settings
 * @example
 * getHeadingLevel({headingType: "h3"})
 * // Returns 3
 */
export const getHeadingLevel = (settings: PluginSettings): number => {
    return parseInt(settings.headingType[1]);
};

/**
 * Generates the Markdown for a heading
 * @example
 * getHeadingMd({headingType: "h3"})
 * // Returns ###
 */
export const getHeadingMd = (settings: PluginSettings): string => {
    return "#".repeat(getHeadingLevel(settings));
};

/**
 * Generates a daily note section heading for a date
 * @example
 * getHeadingForDate({headingType: "h3", dateFormat: "DD-MM-YYYY, dddd"}, date(29-05-24))
 * // Returns ### 29-05-2024, Wednesday
 */
export const getHeadingForDate = (
    settings: PluginSettings,
    date: Moment,
): string => {
    return getHeadingMd(settings) + " " + date.format(settings.dateFormat);
};

/**
 * Generates a daily note section heading for today.
 *
 * See {@link getHeadingForDate}
 */
export const getTodayHeading = (settings: PluginSettings): string => {
    return getHeadingForDate(settings, moment());
};

export const getSectionForDate = (
    settings: PluginSettings,
    date: Moment,
): string => {
    return getHeadingForDate(settings, date) + "\n" + settings.noteEntry;
};

export const getSectionForMonth = (
    settings: PluginSettings,
    date: Moment,
): string => {
    const monthHeading =
        "#".repeat(getHeadingLevel(settings) - 1) +
        " " +
        date.format("MMMM YYYY");

    return "\n" + "---\n" + monthHeading;
};

export const insertNoteForDate = (
    fileContent: string,
    date: moment.Moment,
    settings: PluginSettings,
): [string, FilePosition] => {
    const lines = fileContent.split("\n");

    const headingMd = getHeadingMd(settings);
    let note = getSectionForDate(settings, date);
    let encounteredLaterDate = false;

    // Offset start index if properties are present
    let i = 0;
    if (lines[0] == "---") {
        i++;
        while (lines[i] != "---") {
            i++;
        }
        i++;
    }

    const startIndex = i;

    while (i < lines.length) {
        const line = lines[i];

        if (!line.startsWith(headingMd)) {
            i++;
            continue;
        }

        const lineDate = moment(line.split(" ", 2)[1], settings.dateFormat);

        if (!lineDate.isValid()) {
            i++;
            continue;
        }

        if (lineDate.isAfter(date)) {
            encounteredLaterDate = true;
            i++;
            continue;
        }

        if (lineDate.isSame(date, "date")) {
            return [fileContent, i];
        }

        if (lineDate.isBefore(date)) {
            if (lineDate.month() < date.month()) {
                note += "\n" + getSectionForMonth(settings, lineDate);
            }

            lines.splice(i, 0, note);
            return [lines.join("\n"), i];
        }

        i++;
    }

    if (encounteredLaterDate) {
        lines.push(note);
        return [lines.join("\n"), lines.length];
    }

    lines.splice(startIndex, 0, note);
    return [lines.join("\n"), startIndex];
};
