// const serverHost = "http://api-dev.msvc.top";
/** 服务端地址 */
const serverHost = "/fast_api";

const FastApi = {
  HttpApiManage: {
    getHttpApiTree: `${serverHost}/http_api_manage/http_api_tree`,
    getHttpApiFileResource: `${serverHost}/http_api_manage/http_api_file_resource`,
  },
  FileResourceManage: {
    getFileResource: `${serverHost}/file_resource_manage/file_resource`,
    saveFileContent: `${serverHost}/file_resource_manage/save_file_content`,
  },
  ExtendFileManage: {
    getExtendTree: `${serverHost}/extend_file_manage/extend_tree`,
  },
};

export { FastApi };
