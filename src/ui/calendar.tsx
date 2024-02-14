import React, { StrictMode, useState } from "react";
import { Moment } from "moment";

export default function Calendar() {
    const [date, setDate] = useState(window.moment());

    const monthDates = getMonthWeeks(date);

    return (
        <StrictMode>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button
                    onClick={() => setDate(date.clone().subtract(1, "month"))}
                >
                    Previous
                </button>
                <button onClick={() => setDate(window.moment())}>Today</button>
                <button onClick={() => setDate(date.clone().add(1, "month"))}>
                    Next
                </button>
            </div>
            <h3>{date.format("MMMM YYYY")}</h3>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <Columns week={monthDates[1]} />
                <TableHeader />
                <tbody>
                    {monthDates.map((week, index) => (
                        <tr key={index}>
                            {week.map((day, index) => (
                                <Day
                                    key={index}
                                    date={day}
                                    month={date.month()}
                                />
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </StrictMode>
    );
}

function Columns({ week }: { week: Moment[] }) {
    return (
        <colgroup>
            {week.map((date, index) => (
                <col
                    key={index}
                    style={{
                        backgroundColor: isWeekend(date) ? "lightgray" : "",
                    }}
                />
            ))}
        </colgroup>
    );
}

function TableHeader() {
    const weekDayNames = window.moment.weekdaysShort(true);

    return (
        <thead>
            <tr>
                {weekDayNames.map((day, index) => (
                    <th key={index} style={{ textAlign: "center" }}>
                        {day}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

function Day({ date, month }: { date: Moment; month: number }) {
    return (
        <td
            style={{
                textAlign: "center",
                fontWeight: date.isSame(window.moment(), "day")
                    ? "bold"
                    : "normal",
                color: date.month() === month ? "black" : "gray",
            }}
            onClick={() => console.log(date.format("DD-MM-YYYY"))}
        >
            {date.format("D")}
        </td>
    );
}

function isWeekend(day: Moment): boolean {
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
