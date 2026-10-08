import { SoldierId } from "./domain";

type SoldiersNotReady = {
    readonly _tag: "SoldiersNotReady";
    readonly missionId: number;
    readonly soldierIds: readonly SoldierId[];
  };
  
  type SoldiersAlreadyDeployed = {
    readonly _tag: "SoldiersAlreadyDeployed";
    readonly missionId: number;
    readonly soldierIds: readonly SoldierId[];
  };
  
  type InsufficientHeadcount = {
    readonly _tag: "InsufficientHeadcount";
    readonly missionId: number;
    readonly expected: number;
    readonly got: number;
  };
  
export type {
    SoldiersAlreadyDeployed, SoldiersNotReady, InsufficientHeadcount
}
