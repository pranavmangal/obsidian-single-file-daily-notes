import cx from "classnames";
import { type Dispatch, type SetStateAction, useState } from "react";
import { moment } from "../utils";
import { ChevronLeft, ChevronRight, Dot } from "./components";

export default function Calendar({
    onClickDate,
}: {
    onClickDate: (date: moment.Moment) => void;
}) {
    const [date, setDate] = useState(today());
    const monthDates = getMonthWeeks(date);

    return (
        <div id="calendar">
            <div className="month-and-nav">
                <h3>{date.format("MMM YYYY")}</h3>
                <Navigation date={date} setDate={setDate} />
            </div>
            <table>
                <Columns week={monthDates[1]} />
                <DayNames />
                <MonthDates
                    monthDates={monthDates}
                    date={date}
                    onClickDate={onClickDate}
                />
            </table>
        </div>
    );
}

function Navigation({
    date,
    setDate,
}: {
    date: moment.Moment;
    setDate: Dispatch<SetStateAction<moment.Moment>>;
}) {
    return (
        <div className="nav">
            <ChevronLeft
                className="nav-button"
                onClick={() => setDate(prevMonth(date))}
            />
            <Dot className="nav-button" onClick={() => setDate(today())} />
            <ChevronRight
                className="nav-button"
                onClick={() => setDate(nextMonth(date))}
            />
        </div>
    );
}

function Columns({ week }: { week: moment.Moment[] }) {
    return (
        <colgroup>
            {week.map((date) => (
                <col
                    key={date.toISOString()}
                    className={isWeekend(date) ? "weekend" : undefined}
                />
            ))}
        </colgroup>
    );
}

function DayNames() {
    const weekDayNames = moment.weekdaysShort(true);

    return (
        <thead>
            <tr>
                {weekDayNames.map((day) => (
                    <th key={day}>{day}</th>
                ))}
            </tr>
        </thead>
    );
}

function MonthDates({
    monthDates,
    date,
    onClickDate,
}: {
    monthDates: moment.Moment[][];
    date: moment.Moment;
    onClickDate: (date: moment.Moment) => void;
}) {
    return (
        <tbody>
            {monthDates.map((week) => (
                <tr key={week[0].toISOString()}>
                    {week.map((day) => (
                        <Day
                            key={day.toISOString()}
                            date={day}
                            month={date.month()}
                            onClick={onClickDate}
                        />
                    ))}
                </tr>
            ))}
        </tbody>
    );
}

function Day({
    date,
    month,
    onClick,
}: {
    date: moment.Moment;
    month: number;
    onClick: (date: moment.Moment) => void;
}) {
    return (
        <td>
            <div
                role="button"
                tabIndex={0}
                className={cx("day", {
                    today: date.isSame(today(), "day"),
                    "adjacent-month": date.month() !== month,
                })}
                onClick={() => onClick(date)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        onClick(date);
                    }
                }}
            >
                {date.format("D")}
            </div>
        </td>
    );
}

function today(): moment.Moment {
    return moment();
}

export function nextMonth(date: moment.Moment): moment.Moment {
    return date.clone().add(1, "month");
}

export function prevMonth(date: moment.Moment): moment.Moment {
    return date.clone().subtract(1, "month");
}

export function nextYear(date: moment.Moment): moment.Moment {
    return date.clone().add(1, "year");
}

export function prevYear(date: moment.Moment): moment.Moment {
    return date.clone().subtract(1, "year");
}

export function isWeekend(day: moment.Moment): boolean {
    return day.day() === 0 || day.day() === 6;
}

function getMonthWeeks(date: moment.Moment): moment.Moment[][] {
    const startOfMonth = date.clone().startOf("month");
    const endOfMonth = date.clone().endOf("month");

    const currentDay = startOfMonth;
    currentDay.subtract(currentDay.weekday(), "days");

    const weeks: moment.Moment[][] = [];

    while (currentDay <= endOfMonth) {
        const week: moment.Moment[] = [];
        for (let i = 0; i < 7; i++) {
            week.push(currentDay.clone());
            currentDay.add(1, "days");
        }
        weeks.push(week);
    }

    return weeks;
}
