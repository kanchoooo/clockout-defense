// 게임 전용 그림의 공용 도구. pixelfx 의 critters 와 같은 방식(Grid 에 음영을 넣고 1px 외곽선)으로 그린다.
import { hex, clamp } from "../../vendor/pixelfx/core/index.js";
export { Grid, shift, shadow } from "../../vendor/pixelfx/fx/critters/_lib.js";

export const ramp = (list) => list.map(hex);

/** 왼쪽 위에서 빛이 오는 공 모양 음영: 어두운→밝은 색표 C 에서 색을 고른다 */
export function ballShade(C, nx, ny, boost = 0) {
  const z = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  const l = clamp(0.5 - nx * 0.34 - ny * 0.42 + z * 0.24 + boost);
  return C[Math.min(C.length - 1, Math.floor(l * C.length))];
}

export function ball(g, cx, cy, rx, ry, C, boost = 0) {
  g.ellipse(cx, cy, rx, ry, (nx, ny) => ballShade(C, nx, ny, boost));
}

/** 어두운 외곽선: 아래·오른쪽은 더 어둡게 */
export function ink(g, C0, C1) {
  g.outline((x, y, nx, ny) => (ny > 0 || nx > 0 ? C0 : C1), 1);
}
