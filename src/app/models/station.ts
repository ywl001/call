export class Station {
    mnc: number = 0;
    lac: number = 0;
    ci: number = 0;
    lat: number = 0;
    lng: number = 0;
    addr: string = '';
    count: number = 1;
    acc:number = 0;
    recordIDs = [];

    isSame(station: Station) {
        return this.lac == station.lac && this.ci == station.ci;
    }

    public static toStation(obj) {
        let station = new Station();
        for (let key in obj) {
            if (station.hasOwnProperty(key)) {
                station[key] = obj[key];
            }
        }
        return station;
    }
}
