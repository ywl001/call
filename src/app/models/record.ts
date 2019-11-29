import { Station } from "./station";

export class Record {
    id:number = 0;
    mnc: number = 0;
    lac: number = 0;
    ci: number = 0;
    lat: number = 0;
    lng: number = 0;
    addr: string = '';
    acc: number = 0;
    otherNumber: string = "";
    startTime: string = "";
    callDuration: string = "";
    callType: string = "";

    static toStations(records: Array<Record>): Array<Station> {
        let stations = [];
        //计数基站
        let hasLbsMap = new Map();
        let noHasLbsMap = new Map();
        let len = records.length;
        //获取基站的唯一值
        for (let i = 0; i < len; i++) {
            let r = records[i];
            let key = r.lac + ":" + r.ci;

            if(r.lng ==0 || r.lat ==0 ||r.lac ==0 ||r.ci==0)
                continue;
            else if (!hasLbsMap.has(key)) {
                let station = Station.toStation(r);
                station.recordIDs.push(r.id);
                stations.push(station);
                hasLbsMap.set(key, station);
            } else {
                let station = hasLbsMap.get(key)
                station.recordIDs.push(r.id);
            }
        }
        stations.sort((a, b) => {
            if (a.recordIDs.length > b.recordIDs.length)
                return 1;
            return -1;
        })

        return stations;
    }
}
