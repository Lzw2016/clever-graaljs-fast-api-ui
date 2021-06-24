import React from "react";

const size = 16;

const JsFile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <g fill="none" fillRule="evenodd">
      <path fill="#F4AF3D" fillOpacity=".7" d="M1 16h15V9H1z"/>
      <path fill="#9AA7B0" fillOpacity=".8" d="M7 1L3 5h4z"/>
      <path fill="#9AA7B0" fillOpacity=".8" d="M8 1v5H3v2h10V1z"/>
      <path fill="#231F20" fillOpacity=".7"
            d="M2.395 13.588c.23.25.443.412.892.412.526 0 .713-.412.713-.702V10h1v3.588C5 14.32 4.327 15 3.45 15c-.821 0-1.3-.237-1.65-.68l.595-.732zM6.973 11.502c0-.369.311-.502.872-.502H9v-1H7.86C6.778 10 6 10.46 6 11.45c0 .865.42 1.24 1.471 1.466.77.165 1.025.313 1.025.632 0 .32-.358.452-1.025.452H6.3v1h1.171C9.5 15 9.5 14 9.5 13.548c0-.632-.48-1.127-1.341-1.401-.862-.274-1.186-.277-1.186-.645z"/>
    </g>
  </svg>
);

const JsonFile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <g fill="#9AA7B0" fillRule="evenodd">
      <path
        d="M8.416 13.896c0-.157.021-.578.021-.757 0-.82-.31-1.155-1.168-1.155H7v-.969h.269c.858 0 1.168-.347 1.168-1.167 0-.179-.021-.598-.021-.757 0-1.071.466-1.744 2.349-2.09l.216.84c-1.241.347-1.406.673-1.406 1.44 0 .211.021.557.021.778 0 .82-.393 1.22-1.076 1.442.693.23 1.076.62 1.076 1.44 0 .22-.021.566-.021.777 0 .768.165 1.094 1.406 1.44l-.216.842c-1.883-.348-2.349-1.02-2.349-2.104m3.603 1.262c1.24-.347 1.406-.673 1.406-1.439 0-.21-.02-.558-.02-.779 0-.82.392-1.22 1.075-1.44-.692-.232-1.075-.62-1.075-1.44 0-.22.02-.568.02-.779 0-.768-.165-1.093-1.406-1.44l.217-.84c1.883.345 2.348 1.018 2.348 2.091 0 .158-.021.578-.021.756 0 .821.31 1.167 1.169 1.167H16v.968h-.268c-.86 0-1.17.336-1.17 1.156 0 .18.022.6.022.757 0 1.083-.465 1.756-2.348 2.104l-.217-.842z"/>
      <path fillOpacity=".8"
            d="M7 1L3 5h4zM10.596 12.94c0 .122-.011 1.01-.005 1.035l.002-.002c.03 0 .907.292.907.292s.872-.289.925-.325c-.007-.013-.02-.878-.02-1 0-.449.089-.975.404-1.437-.27-.39-.404-.873-.404-1.444 0-.122.01-1.01.004-1.035l-.001.001c-.031 0-.908-.29-.908-.29s-.872.288-.925.323c.007.014.02.88.02 1.001 0 .45-.09.974-.403 1.437.268.39.404.872.404 1.444"/>
      <path fillOpacity=".8"
            d="M7.416 13.896c0-.084.019-.868.016-.905-.04-.005-1.432-.008-1.432-.008v-2.968s1.391-.003 1.431-.008c.004-.038-.015-.83-.015-.915 0-2.21 1.692-2.804 3.168-3.076l.916-.168.916.168c.192.035.389.077.584.127V1H8v5H3v9h4.609a3.214 3.214 0 0 1-.193-1.104"/>
    </g>
  </svg>
);

const XmlFile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <g fill="none" fillRule="evenodd">
      <path fill="#F26522" fillOpacity=".7" d="M1 16h15V9H1z"/>
      <path fill="#9AA7B0" fillOpacity=".8" d="M7 1L3 5h4z"/>
      <path fill="#9AA7B0" fillOpacity=".8" d="M8 1v5H3v2h10V1z"/>
      <path fill="#231F20" fillOpacity=".7" d="M3 13v-1l3-2v1l-2.2 1.5L6 14v1zM8 14l2.2-1.5L8 11v-1l3 2v1l-3 2z"/>
    </g>
  </svg>
);

const YmlFile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <g fill="none" fillRule="evenodd">
      <path fill="#F98B9E" fillOpacity=".7" d="M1 16h15V9H1z"/>
      <path fill="#9AA7B0" fillOpacity=".8" d="M7 1L3 5h4z"/>
      <path fill="#9AA7B0" fillOpacity=".8" d="M8 1v5H3v2h10V1z"/>
      <path fill="#231F20" fillOpacity=".7"
            d="M2.996 15v-1.971L1 10h1.05l1.446 2.207L4.95 10H6l-2 3.007V15zM6 10h.936L8.5 12l1.479-2H11v5h-1v-3.3l-1.5 1.8L7 11.7V15H6zM12 10h1v4h2.5v1H12z"/>
    </g>
  </svg>
);

const UnknownFile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <g fill="none" fillRule="evenodd">
      <path fill="#9AA7B0" fillOpacity=".8" d="M7 1L3 5h4z"/>
      <path fill="#9AA7B0" fillOpacity=".8" d="M11 15H3V6h5V1h5l-.023 5A4 4 0 0 0 9 10c0 .232.042.567.127 1.006H11V15z"/>
      <path fill="#40B6E0"
            d="M12.25 16h1.5v-1.5h-1.5V16zM13 7a3 3 0 0 0-3 3h1.5c0-.825.675-1.5 1.5-1.5s1.5.675 1.5 1.5c0 1.5-2.25 1.313-2.25 3.75h1.5c0-1.688 2.25-1.875 2.25-3.75a3 3 0 0 0-3-3z"/>
    </g>
  </svg>
);

const Folder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <path d="M9 5a2.51 2.51 0 0 0-2.5-2H1v11h14V5z"/>
  </svg>
);

const ChevronUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <path fillRule="evenodd" clipRule="evenodd" d="M8 6.04042L3.02022 11.0202L2.31311 10.3131L7.64645 4.97976L8.35355 4.97976L13.6869 10.3131L12.9798 11.0202L8 6.04042Z"
          fill="#C5C5C5"/>
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
    <path fillRule="evenodd" clipRule="evenodd" d="M7.97602 10.0719L12.3333 5.7146L12.952 6.33332L8.28538 11L7.66666 11L3 6.33332L3.61872 5.7146L7.97602 10.0719Z" fill="#C5C5C5"/>
  </svg>
);

const getFileIcon = (filename: string): (() => JSX.Element) => {
  if (!filename) return UnknownFile;
  const position = filename.lastIndexOf(".");
  if (position < 0) return UnknownFile;
  const ext = filename.substr(position).toLowerCase();
  switch (ext) {
    case ".js":
      return JsFile;
    case ".json":
      return JsFile;
    case ".yml":
    case ".yaml":
      return JsFile;
  }
  return JsonFile
}

export { JsFile, JsonFile, YmlFile, UnknownFile, getFileIcon, Folder, ChevronUp, ChevronDown }
