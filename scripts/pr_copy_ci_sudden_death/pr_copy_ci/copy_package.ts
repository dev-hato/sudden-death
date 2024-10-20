import {readFileSync,writeFileSync} from "fs";

export default function script() {
  const hatoBotPackage:{ [key:string]: any}=JSON.parse(readFileSync(`${process.env.GITHUB_WORKSPACE}/hato-bot/package.json`).toString());
  const suddenDeathPackagePath=`${process.env.GITHUB_WORKSPACE}/sudden-death/package.json`;
  const suddenDeathPackage:{ [key:string]: any}=JSON.parse(readFileSync(suddenDeathPackagePath).toString());
  delete hatoBotPackage.scripts;

  for (const packageKey of Object.keys(hatoBotPackage)) {
    suddenDeathPackage[packageKey] = hatoBotPackage[packageKey];
  }

  writeFileSync(
    suddenDeathPackagePath,
    JSON.stringify(suddenDeathPackage, null, "  ") + "\n",
    "utf8",
  );

  const hatoBotPackageLock: { [key:string]: any}=JSON.parse(readFileSync(`${process.env.GITHUB_WORKSPACE}/hato-bot/package-lock.json`).toString());
  const suddenDeathPackageLockPath=`${process.env.GITHUB_WORKSPACE}/sudden-death/package-lock.json`;
  const suddenDeathPackageLock:{ [key:string]: any}=JSON.parse(readFileSync(suddenDeathPackageLockPath).toString());
  delete hatoBotPackageLock.name;

  for (const packageLockKey of Object.keys(hatoBotPackageLock)) {
    suddenDeathPackageLock[packageLockKey] = hatoBotPackageLock[packageLockKey];
  }

  writeFileSync(
    suddenDeathPackageLockPath,
    JSON.stringify(suddenDeathPackageLock, null, "  ") + "\n",
    "utf8",
  );
}
