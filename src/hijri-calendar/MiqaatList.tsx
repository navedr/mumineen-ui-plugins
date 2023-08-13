import * as React from "react";
import { MiqaatMonth } from "./HijriCalender.interface";
import { Day } from "./libs/HijriCalendar";
import { useDayMiqaats } from "./utils";

export const MiqaatList: React.FC<{ day: Day; miqaats?: MiqaatMonth[] }> = React.memo(({ miqaats, day }) => {
    const listItems = React.useMemo(() => {
        var items = [];
        if (day) {
            const { hijri } = day;
            items = useDayMiqaats(miqaats, day).map(miqaat => {
                if (miqaat.year && miqaat.year > hijri.year) return null;
                return (
                    <li key={miqaat.title}>
                        {miqaat.title}
                        <br />
                        <span className="description">{miqaat.description}</span>
                    </li>
                );
            });
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
