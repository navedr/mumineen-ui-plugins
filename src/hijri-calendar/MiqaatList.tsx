import * as React from "react";
import { MiqaatMonth } from "./HijriCalender.interface";
import { Day } from "./libs/HijriCalendar";

export const MiqaatList: React.FC<{ day: Day; miqaats?: MiqaatMonth[] }> = React.memo(({ miqaats, day }) => {
    const listItems = React.useMemo(() => {
        var items = [];
        if (miqaats.length < 1) return <li className="error">Sorry, there was a problem loading the miqaat data...</li>;
        if (day) {
            const { hijri } = day;
            items = miqaats
                .filter(({ date, month }) => date == hijri.date && month == hijri.month)
                .map(({ miqaats }) => miqaats)
                .flat()
                .map(miqaat => {
                    if (miqaat.year && miqaat.year > hijri.year) return null;
                    return (
                        <li key={miqaat.title}>
                            {miqaat.title}
                            <br />
                            <span className="description">{miqaat.description}</span>
                        </li>
                    );
                });
            // .compact()
        }
        if (items.length < 1) {
            return <li className="none">There are no miqaats on this day.</li>;
        }
        return items;
    }, [miqaats, day]);

    return (
        <div className="miqaat-list">
            <ul className="miqaats">{listItems}</ul>
        </div>
    );
});
