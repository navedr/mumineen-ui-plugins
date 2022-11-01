import * as React from "react";
import { CalendarWeek } from "./CalendarWeek";
import { MiqaatMonth } from "./HijriCalender.interface";
import { HijriCalendar } from "./libs/HijriCalendar";

export const Calendar: React.FC<{
    today: any;
    onDayClick: (day) => void;
    calendar: HijriCalendar;
    miqaats?: MiqaatMonth[];
}> = React.memo(({ today, onDayClick, calendar, miqaats }) => {
    return (
        <div className="calendar">
            <table>
                <thead>
                    <tr>
                        <th>Sun</th>
                        <th>Mon</th>
                        <th>Tue</th>
                        <th>Wed</th>
                        <th>Thu</th>
                        <th>Fri</th>
                        <th>Sat</th>
                    </tr>
                </thead>
                <tbody>
                    {calendar.weeks().map((week, key) => {
                        return (
                            <CalendarWeek
                                key={key}
                                week={week}
                                today={today}
                                miqaats={miqaats?.filter(({ month }) => month == calendar.getMonth())}
                                onDayClick={onDayClick}
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
});
