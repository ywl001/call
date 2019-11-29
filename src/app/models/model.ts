export class Model {
    //////////////////////////列标题////////////////////////

    /**
     * 联通、移动、电信4G列标题基站代码
     */
    public static LAC: string = "lac"
    public static LAC_CN: string = '基站代码';

    /**
     * 联通、移动、电信4G列标题小区ID
     */
    public static CI_CN: string = '小区ID';
    public static CI: string = 'ci';

    /**运营商标识码 */
    public static MNC = 'mnc';
    /**
     * cdma话单中的通话地
     */
    public static CDMA_CITY: string = '通话地';

    /**
     * cdma话单中的蜂窝号
     */
    public static CDMA_CI: string = '蜂窝号';

    /**
     * cdma的sid
     */
    public static CDMA_SID: string = 'sid';

    /**
     * 列标题对端号码
     */
    public static OTHER_NUMBER_CN: string = "对端号码";
    public static OTHER_NUMBER: string = "otherNumber"

    /**
     * 列标题起始时间
     */
    public static START_TIME_CN: string = "起始时间";
    public static START_TIME: string = "startTime";

    /**
     * 列标题通话时长
     */
    public static DURATION_CN: string = "通话时长";
    public static DURATION: string = "callDuration";

    /**
     * 列标题通话类型
     */
    public static CALL_TYPE_CN: string = "通话类型";
    public static CALL_TYPE: string = "callType";

    /**
    * 列标题通话类型
    */
    public static TABLE_NAME: string = "话单名称";

    /**
     * 列标题lat
     */
    public static LAT: string = 'lat';

    /**
     * 列标题lng
     */
    public static LNG: string = 'lng';

    /**
     * 列标题addr基站地址描述
     */
    public static ADDR: string = 'addr';

    /**
    * 列标题acc基站覆盖半径
    */
    public static ACC: string = 'acc';

    /**号码对应的机主信息 */
    public static CONTACT:string = 'contact'
    public static INSERT_TIME:string = 'insertTime'


    //通话统计
    public static COUNT_CALL: string = "通话次数";
    public static TOTAL_TIME: string = "总时长";

    //共同联系人
    public static COUNT_TABLE: string = "数量";

    //////////////////////表格的显示状态//////////////////////////////////
    /**通话记录状态 */
    static RECORDS_STATE = 1;
    /**号码统计状态 */
    static RECORD_COUNT_STATE = 2
    /**共同联系人状态 */
    static COMMON_CONTACTS_STATE = 3;
    /**共同联系人的通话记录状态 */
    static RECORDS_COMMON_CONTACTS_STATE = 4;

    /**浏览器宽高 */
    public static width: number;
    public static height: number;

    /**
     * 当前表名称
    */
    public static currentTable: string;

    /**
     * 当前话单所有通话记录,包含了经纬度信息,当点击话单的时候获取
     */
    public static allRecords: any[];

    public static allRecordsMap: Map<number, any>;

    /**
     * 所有话单名称
     */
    public static tables: any[];

    /**
     * 是否显示返回按钮，用于返回话单统计和共同联系人
     */
    public static isShowBtnBack: boolean;


    /**号码对应的姓名 */
    public static Contacts: Map<string, any>;


    public static sqlUrl = '/hdzs/sql.php'

    /**保存可能的表格列定义的字段，从本地assets/fields.json获取 */
    public static fieldsMap;

}
