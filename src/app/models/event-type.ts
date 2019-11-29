export class EventType {

    /**显示多个基站 带station数组 */
    public static SHOW_STATIONS: string = "showStations";

    /**显示单个基站，带station */
    public static SHOW_STATION: string = "showStation";

    // public static ADD_MARKER_COMPLETE: string = "addMarkerComplete";
    //

    /**开关中间表格，可带数字参数，1表示表格宽度不变，其他数字表示表格宽度调整为该数字*/
    public static OPEN_MIDDLE: string = "openMiddle";

    /** 打开地图区域 无参数 */
    public static OPEN_RIGHT: string = "openRight";

    /** 打开菜单区域 无参数 */
    public static CLOSE_LEFT: string = "closeLeft";


    public static IS_TOGGLE_MIDDLE: string = "isToggleMiddle";

    /** 显示对端号码统计信息 带表格数据参数*/
    // public static SHOW_RECORD_COUNT: string = "showRecordCount";

    /**显示表格数据，带{data:data,state:state}参数 */
    public static SHOW_RECORDS: string = "showRecords";
    //显示共同联系人
    // public static SHOW_COMMON_CONTACTS: string = "showCommonContacts";

    public static SHOW_STATIONS_RECORDS: string = "showStationRecords";
    
    public static REFRESH_TABLE: string = "refreshTable";
    public static CLEAR_GRID_DATA: string = 'clearGridData';
    public static CLEAR_MARKER: string = "clearMarker";
    
    public static SHOW_COMMON_CONTACTS_UI: string = "showCommonContactsUI";

    //是否显示busy图标
    public static IS_SHOW_BUSY_ICON: string = "isShowLoader";


}
