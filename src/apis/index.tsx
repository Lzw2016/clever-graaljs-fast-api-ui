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
};

export { FastApi };
