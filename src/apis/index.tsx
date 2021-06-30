// const serverHost = "http://api-dev.msvc.top";
/** 服务端地址 */
const serverHost = "/fast_api";

const FastApi = {
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
  },
  ExtendFileManage: {
    getExtendTree: `${serverHost}/extend_file_manage/extend_tree`,
    getExtendFileList: `${serverHost}/extend_file_manage/extend_file_list`,
  },
};

export { FastApi };
