import { SwarmEnv } from "./swarmCoreR169";
import { OmegaSwarmCoordinator as OmegaSwarmCoordinatorR169 } from "./swarmCoordinatorR169";
import { advanceScheduledMotionR188, handleMotionCoordinatorR188 } from "./motionTimeR188";

export class OmegaSwarmCoordinatorR188 extends OmegaSwarmCoordinatorR169 {
  private readonly motionStorage: any;
  private readonly motionEnv: SwarmEnv;

  constructor(state: any, env: SwarmEnv) {
    super(state, env);
    this.motionStorage = state.storage;
    this.motionEnv = env;
  }

  async alarm(): Promise<void> {
    await advanceScheduledMotionR188(this.motionStorage, this.motionEnv);
    await super.alarm();
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/motion/r188/")) {
      return handleMotionCoordinatorR188(request, this.motionStorage, this.motionEnv);
    }
    return super.fetch(request);
  }
}
