import { SoldierId } from "./domain";

type MissionNotFound = {
    readonly _tag: "Error/MissionNotFound";
    readonly missionId: number;
  };
  
  type UnknownSoldiers = {
    readonly _tag: "Error/UnknownSoldiers";
    readonly missionId: number;
    readonly soldierIds: readonly SoldierId[];
  };

export type {MissionNotFound, UnknownSoldiers}
