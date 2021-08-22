// const serverHost = "http://api-dev.msvc.top";
/** 服务端地址 */
const serverHost = "/fast_api";

const FastApi = {
  Global: {
    getGlobalEnv: `${serverHost}/global_env`,
    getStatus: `${serverHost}/script_engine_status`,
  },
  HttpGlobalRequestDataManage: {
    getAll: `${serverHost}/http_global_request_data_manage/all`,
    saveOrUpdate: `${serverHost}/http_global_request_data_manage/save_or_update`,
    delete: `${serverHost}/http_global_request_data_manage/delete`,
  },
  HttpApiManage: {
    getHttpApiTree: `${serverHost}/http_api_manage/http_api_tree`,
    getHttpApiFileResource: `${serverHost}/http_api_manage/http_api_file_resource`,
    addHttpApi: `${serverHost}/http_api_manage/add_http_api`,
    delHttpApi: `${serverHost}/http_api_manage/del_http_api`,
    updateHttpApi: `${serverHost}/http_api_manage/update_http_api`,
  },
  FileResourceManage: {
    getFileResource: `${serverHost}/file_resource_manage/file_resource`,
    saveFileContent: `${serverHost}/file_resource_manage/save_file_content`,
    addDir: `${serverHost}/file_resource_manage/add_dir`,
    rename: `${serverHost}/file_resource_manage/rename`,
    addFile: `${serverHost}/file_resource_manage/add_file`,
    delFile: `${serverHost}/file_resource_manage/del_file`,
  },
  ExtendFileManage: {
    getExtendTree: `${serverHost}/extend_file_manage/extend_tree`,
    getExtendFileList: `${serverHost}/extend_file_manage/extend_file_list`,
  },
  HttpApiDebugManage: {
    getTitleList: `${serverHost}/http_api_debug_manage/title_list`,
    getHttpApiDebug: `${serverHost}/http_api_debug_manage/http_api_debug`,
    addHttpApiDebug: `${serverHost}/http_api_debug_manage/add_debug`,
    updateHttpApiDebug: `${serverHost}/http_api_debug_manage/update_debug`,
    delHttpApiDebug: `${serverHost}/http_api_debug_manage/del_debug`,
  },
  JdbcDatabaseManage: {
    getAll: `${serverHost}/jdbc_database_manage/all`,
    addJdbc: `${serverHost}/jdbc_database_manage/add`,
    delJdbc: `${serverHost}/jdbc_database_manage/del`,
    updateJdbc: `${serverHost}/jdbc_database_manage/update`,
    getStatus: `${serverHost}/jdbc_database_manage/status`,
  },
  RedisManage: {
    getAll: `${serverHost}/redis_manage/all`,
    addRedis: `${serverHost}/redis_manage/add`,
    delRedis: `${serverHost}/redis_manage/del`,
    updateRedis: `${serverHost}/redis_manage/update`,
    getStatus: `${serverHost}/redis_manage/status`,
  },
  TaskManage: {
    getJsJobTree: `${serverHost}/task_manage/js_job_tree`,
    getJsJobInfo: `${serverHost}/task_manage/js_job_info`,
    addJsJob: `${serverHost}/task_manage/add_js_job`,
    delJsJob: `${serverHost}/task_manage/del_js_job`,
  },
};

export { FastApi };
