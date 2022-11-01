import * as React from "react";
// import "./styles.css";
import { Calendar } from "./Calendar";
import { YearControls } from "./YearControls";
import { TodayButton } from "./TodayButton";
import { MonthControls } from "./MonthControls";
import { Modal } from "./Modal";
import { MiqaatMonth } from "./HijriCalender.interface";
import { HijriDate } from "./libs/HijriDate";
import { Day, HijriCalendar } from "./libs/HijriCalendar";

export const CalendarFrame: React.FC<{
    miqaats?: MiqaatMonth[];
    additionalDayContent?: (day: Day) => React.ReactNode;
}> = React.memo(({ miqaats = [], additionalDayContent }) => {
    const modalId = "modal";
    const today = HijriDate.fromGregorian(new Date());
    const [day, setDay] = React.useState<Day>(null);
    const [calendar, setCalendar] = React.useState<HijriCalendar>(new HijriCalendar(today.getYear(), today.getMonth()));

    const navigateToToday = React.useCallback(
        () => setCalendar(new HijriCalendar(today.getYear(), today.getMonth())),
        [setCalendar, today],
    );

    const changeMonth = React.useCallback(
        monthChange => setCalendar(monthChange < 0 ? calendar.previousMonth() : calendar.nextMonth()),
        [setCalendar, calendar],
    );

    const changeYear = React.useCallback(
        yearChange => setCalendar(yearChange < 0 ? calendar.previousYear() : calendar.nextYear()),
        [setCalendar, calendar],
    );

    const showModal = React.useCallback(
        _day => {
            setDay(_day);
            document.getElementById(modalId).getElementsByTagName("input").item(0).checked = true;
        },
        [setDay],
    );

    const miqaatList = miqaats || [];

    return (
        <div className="calendar-frame">
            <div className="year-row">
                <YearControls year={calendar.getYear()} onYearChange={changeYear} />
                <TodayButton onClick={navigateToToday} />
            </div>
            <div className="month-row">
                <MonthControls month={calendar.getMonth()} onMonthChange={changeMonth} />
            </div>
            <Calendar calendar={calendar} today={today} miqaats={miqaatList} onDayClick={showModal} />
            <Modal modalId={modalId} miqaats={miqaatList} day={day} additionalContent={additionalDayContent} />
        </div>
    );
});
