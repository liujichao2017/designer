export const cx = (...args: unknown[]) => args.flat().filter(x => typeof x === 'string').join(' ').trim()

/**
 * Format a number of bytes into a human-readable format.
 *
 * @param {number} bytes - The number of bytes to be formatted.
 * @param {number} [decimals=2] - The number of decimal places to round the result to.
 * @return {string} - The formatted string representing the number of bytes.
 * 
 * example:
 * formatBytes(1024) => 1KB
 * formatBytes(1024 * 1024) => 1MB
 * formatBytes(1024 * 1024 + 123) => 1.12MB
 * formatBytes(1024 * 1024 + 123, 3) => 1.123MB
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatMoney (number: number, decPlaces: number = 2, decSep: string = ".", thouSep: string = ",") {
  decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
    decSep = typeof decSep === "undefined" ? "." : decSep;
  thouSep = typeof thouSep === "undefined" ? "," : thouSep;
  var sign = number < 0 ? "-" : ""
  //@ts-ignore
  var i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decPlaces)));
  //@ts-ignore
  var j = (j = i.length) > 3 ? j % 3 : 0;

  //@ts-ignore
  return sign + (j ? i.substr(0, j) + thouSep : "") + i.substr(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) + (decPlaces ? decSep + Math.abs(number - i).toFixed(decPlaces).slice(2) : "");
}

/**
 * Generates a random code with the specified length.
 *
 * @param {number} len - The length of the code to be generated.
 * @return {string} The randomly generated code.
 */
export const randCode = (len: number = 6) => {
  return Array(len).join().replace(/(.|$)/g, () => ((Math.random() * 36) | 0).toString(36)[Math.random() < .5 ? "toString" : "toUpperCase"]())
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function chunk<T> (array: T[], chunkSize: number): T[][] {
  const size = Math.ceil(array.length / chunkSize)
  const chunks = new Array(chunkSize).fill(0)
  return chunks.map((_, index) => {
    const start = index * size
    const end = (index + 1) * size
    const sliced = array.slice(start, end)
    return sliced
  })
}

export function shuffle<T> (arr: T[]): T[] {
  let m = arr.length
  while (m) {
    const i = Math.floor(Math.random() * m--);
    [arr[m], arr[i]] = [arr[i], arr[m]];
  }
  return arr
}

export function spawnRand (len: number = 20) {
  return Array(len).map(_ => Math.random())
}

type EnumObject = { [key: string]: number | string };
type EnumObjectEnum<E extends EnumObject> = E extends { [key: string]: infer ET | string } ? ET : never;
export function getEnumValues<E extends EnumObject> (enumObject: E): EnumObjectEnum<E>[] {
  return Object.keys(enumObject)
    .filter(key => Number.isNaN(Number(key)))
    .map(key => enumObject[key] as EnumObjectEnum<E>);
}

export function range<T extends number> (length: T, start: number = 0, step: number = 1): T[] {
  return Array.from({ length }).map((_, i) => i * step + start) as T[]
}

export function groupBy<T, K extends keyof any> (list: T[], getKey: (item: T) => K) {
  return list.reduce((previous, currentItem) => {
    const group = getKey(currentItem)
    if (!previous[group]) previous[group] = []
    previous[group].push(currentItem)
    return previous
  }, {} as Record<K, T[]>)
}


export function numDiv (num1: number, num2: number) {
  var baseNum1 = 0, baseNum2 = 0;
  var baseNum3, baseNum4;
  try {
    baseNum1 = num1.toString().split(".")[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split(".")[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  baseNum3 = Number(num1.toString().replace(".", ""));
  baseNum4 = Number(num2.toString().replace(".", ""));
  return (baseNum3 / baseNum4) * Math.pow(10, baseNum2 - baseNum1);
}
export function numMulti (arg1: number, arg2: number) {
  let m = 0,
    s1 = arg1.toString(),
    s2 = arg2.toString();
  try {
    m += s1.split(".")[1].length
  } catch (e) {
  }
  try {
    m += s2.split(".")[1].length
  } catch (e) {
  }
  return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
}
export const mimeTypes: {[key: string]: string[]} = {
  excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  word: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  text: ['text/plain'],
  ppt: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
  pdf: ['application/pdf'],
  code: ['text/html', 'text/css', 'application/javascript', 'application/json', 'application/xml']
};
export function getFileType(file: File) {
  for (let type in mimeTypes) {
      if (mimeTypes[type].includes(file.type)) {
          return type;
      }
  }
  return 'unknown';
}
export function getAllAllowTypes() {
  return mimeTypes.excel.concat(mimeTypes.word).concat(mimeTypes.text)
  .concat(mimeTypes.ppt).concat(mimeTypes.image).concat(mimeTypes.pdf).concat(mimeTypes.code)
}