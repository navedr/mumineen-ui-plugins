export class DateUtil {
    public static monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    public static getMonthName(month) {
        return DateUtil.monthNames[month];
    }

    public static getShortMonthName(month) {
        return DateUtil.getMonthName(month).substr(0, 3);
    }
}
