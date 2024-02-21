import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Moment } from "moment";
import cx from "classnames";

import { ChevronLeft, ChevronRight, Dot } from "./components";

export default function Calendar({
    onClickDate,
}: {
    onClickDate: (date: Moment) => any;
}) {
    const [date, setDate] = useState(today());

    const monthDates = getMonthWeeks(date);

    const handleKeyPress = (event: KeyboardEvent) => {
        console.log(`Key pressed: ${event.key}`);
        switch (event.key) {
            case "ArrowLeft":
                setDate(prevMonth(date));
                break;
            case "ArrowRight":
                setDate(nextMonth(date));
                break;
            case "ArrowUp":
                setDate(prevYear(date));
                break;
            case "ArrowDown":
                setDate(nextYear(date));
                break;
            case " ":
                setDate(today());
                break;
        }
    };

    useEffect(() => {
        document.addEventListener("keydown", handleKeyPress);

        return () => {
            document.removeEventListener("keydown", handleKeyPress);
        };
    }, [handleKeyPress]);

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
                    onClickDay={onClickDate}
                />
            </table>
        </div>
    );
}

function Navigation({
    date,
    setDate,
}: {
    date: Moment;
    setDate: Dispatch<SetStateAction<Moment>>;
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

function Columns({ week }: { week: Moment[] }) {
    return (
        <colgroup>
            {week.map((date, index) => (
                <col
                    key={index}
                    className={isWeekend(date) ? "weekend" : undefined}
                />
            ))}
        </colgroup>
    );
}

function DayNames() {
    const weekDayNames = window.moment.weekdaysShort(true);

    return (
        <thead>
            <tr>
                {weekDayNames.map((day, index) => (
                    <th key={index}>{day}</th>
                ))}
            </tr>
        </thead>
    );
}

function MonthDates({
    monthDates,
    date,
    onClickDay,
}: {
    monthDates: Moment[][];
    date: Moment;
    onClickDay: (date: Moment) => any;
}) {
    return (
        <tbody>
            {monthDates.map((week, index) => (
                <tr key={index}>
                    {week.map((day, index) => (
                        <Day
                            key={index}
                            date={day}
                            month={date.month()}
                            onClick={onClickDay}
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
    date: Moment;
    month: number;
    onClick: (date: Moment) => any;
}) {
    return (
        <td>
            <div
                className={cx("day", {
                    today: date.isSame(today(), "day"),
                    "adjacent-month": date.month() !== month,
                })}
                onClick={() => onClick(date)}
            >
                {date.format("D")}
            </div>
        </td>
    );
}

function today(): Moment {
    return window.moment();
}

export function nextMonth(date: Moment): Moment {
    return date.clone().add(1, "month");
}

export function prevMonth(date: Moment): Moment {
    return date.clone().subtract(1, "month");
}

export function nextYear(date: Moment): Moment {
    return date.clone().add(1, "year");
}

export function prevYear(date: Moment): Moment {
    return date.clone().subtract(1, "year");
}

export function isWeekend(day: Moment): boolean {
    return day.isoWeekday() === 6 || day.isoWeekday() === 7;
}

function getMonthWeeks(date: Moment): Moment[][] {
    const startOfMonth = date.clone().startOf("month");
    const endOfMonth = date.clone().endOf("month");

    const currentDay = startOfMonth;
    currentDay.subtract(currentDay.weekday(), "days");

    const weeks: Moment[][] = [];

    while (currentDay <= endOfMonth) {
        const week: Moment[] = [];
        for (let i = 0; i < 7; i++) {
            week.push(currentDay.clone());
            currentDay.add(1, "days");
        }
        weeks.push(week);
    }

    return weeks;
}
