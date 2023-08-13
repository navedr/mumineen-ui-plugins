import * as React from "react";
import { CalendarDay } from "./CalendarDay";
import { MiqaatMonth } from "./HijriCalender.interface";
import { Day } from "./libs/HijriCalendar";

export const CalendarWeek: React.FC<{
    today: any;
    onDayClick: (day: Day) => void;
    miqaats?: MiqaatMonth[];
    week: any[];
}> = React.memo(({ today, onDayClick, miqaats, week }) => {
    return (
        <tr>
            {week.map(function (day) {
                const key = [day.hijri.year, day.hijri.month, day.hijri.date].join("-");
                return <CalendarDay key={key} day={day} today={today} miqaats={miqaats} onDayClick={onDayClick} />;
            })}
        </tr>
    );
});
