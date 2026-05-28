import { wfProfile } from "../../types/types";
import { platform } from "@tauri-apps/plugin-os";
import { homeDir, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import {
  stat,
  writeTextFile,
  BaseDirectory,
  exists,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";
import { useEffect } from "react";

export interface homeProps {
  userData: wfProfile | undefined;
  setUserData: React.Dispatch<React.SetStateAction<wfProfile | undefined>>;
  setProfileLastUpdated: React.Dispatch<React.SetStateAction<Date | null>>;
}

export default function Home(props: homeProps) {
  async function getWfID() {
    const os = platform();
    console.log(os);
    let home = "";
    let defaultPath = "";
    home = await homeDir();

    if (os.toLowerCase() === "linux") {
      defaultPath = await join(
        home,
        ".local/share/Steam/steamapps/compatdata/230410/pfx/drive_c/users/steamuser/AppData/Local/Warframe/",
      );
    }

    const file = await open({
      multiple: false,
      directory: false,
      defaultPath: defaultPath,
    });

    if (file === null) return;

    const contents = await readTextFile(file);
    const lines = contents.split(/\r?\n/);
    const term = "Logged in";
    const regex = /\((\w+)\)/;
    const matchedLine = lines.find((line) => line.includes(term));

    if (matchedLine) {
      const hasMatch = regex.test(matchedLine);
      if (hasMatch) {
        const extractedId = matchedLine.match(regex)?.[1];
        if (extractedId) await getWfProfile(extractedId);
      }
    }
  }

  async function getWfProfile(id: string) {
    if (!id || id === "") return;

    const fileName = id.concat(".json");
    const fileExists = await exists(fileName, {
      baseDir: BaseDirectory.AppCache,
    });

    let isFresh = false;
    const refreshTime = 1; // refetch the profile data every hour, to prevent ip block
    const forceFetch = false;

    if (fileExists) {
      const metadata = await stat(fileName, {
        baseDir: BaseDirectory.AppCache,
      });
      const modified = metadata.mtime;
      const fileAgeMs = Date.now() - modified!.getTime();
      //console.log(`File is ${fileAgeMs / 1000 / 60 / 24} hours old.`);
      const hoursOld = fileAgeMs / 1000 / 60 / 24;
      if (hoursOld > refreshTime) isFresh = false;
      else isFresh = true;
    }

    let contents = "";

    if (!isFresh || forceFetch) {
      const url = `https://api.warframe.com/cdn/getProfileViewingData.php?playerId=${id}`;
      console.log("fetching refreshed profile data: ", url);
      const res = await fetch(url);
      const json = await res.json();
      contents = JSON.stringify(json, null, 2);
      await writeTextFile(fileName, contents, {
        baseDir: BaseDirectory.AppCache,
      });
    } else {
      console.log("profile data already recent, reading from file: ", fileName);
      contents = await readTextFile(fileName, {
        baseDir: BaseDirectory.AppCache,
      });
    }

    const parsed = JSON.parse(contents);
    console.log(parsed);

    props.setUserData({
      Results: parsed.Results[0],
      Stats: parsed.Stats,
    });
  }

  useEffect(() => {
    if (props.userData) console.log(props.userData.Results.DisplayName);
  }, [props.userData]);

  return (
    <div className="p-4!">
      <h1 className="w-full text-white text-4xl text-center">Home page</h1>
      {props.userData ? (
        <div></div>
      ) : (
        <div>
          <div className="flex gap-4 items-center">
            <span className="text-white">no previous account loaded</span>
            <button
              className="text-white border-2 border-gray-700 p-2! w-fit! h-fit! hover:bg-gray-900 hover:text-blue-300"
              onClick={getWfID}
            >
              open EE.log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
