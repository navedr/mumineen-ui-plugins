import * as React from "react";
import "./styles.css";
import { Calendar } from "./Calendar";
import { YearControls } from "./YearControls";
import { TodayButton } from "./TodayButton";
import { MonthControls } from "./MonthControls";
import { Modal } from "./Modal";
import { HijriDate } from "./libs/HijriDate";
import { Day, HijriCalendar } from "./libs/HijriCalendar";
import { CalendarContext } from "./CalenderContext";
import { Miqaat, MiqaatMonth } from "./HijriCalender.interface";
import { useDayMiqaats } from "./utils";

export const CalendarFrame: React.FC<{
    miqaats?: MiqaatMonth[];
    additionalDayContent?: (day: Day) => React.ReactNode;
    onDayClick?: (day: Day, miqaats: Miqaat[]) => void;
    showDefaultMiqaatData?: boolean;
}> = React.memo(({ miqaats: passedMiqaats = [], additionalDayContent, showDefaultMiqaatData, onDayClick }) => {
    const modalId = "modal";
    const today = HijriDate.fromGregorian(new Date());
    const [day, setDay] = React.useState<Day>(null);
    const [calendar, setCalendar] = React.useState<HijriCalendar>(new HijriCalendar(today.getYear(), today.getMonth()));
    const [miqaats, setMiqaats] = React.useState<MiqaatMonth[]>([]);

    const navigateToToday = React.useCallback(
        () => setCalendar(new HijriCalendar(today.getYear(), today.getMonth())),
        [setCalendar, today],
    );

    const changeMonth = React.useCallback(
        (monthChange: number) => setCalendar(monthChange < 0 ? calendar.previousMonth() : calendar.nextMonth()),
        [setCalendar, calendar],
    );

    const changeYear = React.useCallback(
        (yearChange: number) => setCalendar(yearChange < 0 ? calendar.previousYear() : calendar.nextYear()),
        [setCalendar, calendar],
    );

    const showModal = React.useCallback(
        (_day: Day) => {
            setDay(_day);
            document.getElementById(modalId).getElementsByTagName("input").item(0).checked = true;
        },
        [setDay],
    );

    const onDayClickHandler = React.useCallback(
        (day: Day) => {
            if (onDayClick) {
                onDayClick(day, useDayMiqaats(miqaats, day));
            } else {
                showModal(day);
            }
        },
        [onDayClick, showModal],
    );

    React.useEffect(() => {
        if (showDefaultMiqaatData) {
            const data = require("./data/miqaats.json");
            setMiqaats(data);
        } else {
            setMiqaats(passedMiqaats);
        }
    }, [passedMiqaats, showDefaultMiqaatData, setMiqaats]);

    return (
        <CalendarContext.Provider value={{ miqaats }}>
            <div className="hijri-calendar">
                <div className="year-row">
                    <YearControls year={calendar.getYear()} onYearChange={changeYear} />
                    <TodayButton onClick={navigateToToday} />
                </div>
                <div className="month-row">
                    <MonthControls month={calendar.getMonth()} onMonthChange={changeMonth} />
                </div>
                <Calendar calendar={calendar} today={today} miqaats={miqaats} onDayClick={onDayClickHandler} />
                {!onDayClick && (
                    <Modal modalId={modalId} miqaats={miqaats} day={day} additionalContent={additionalDayContent} />
                )}
            </div>
        </CalendarContext.Provider>
    );
});
