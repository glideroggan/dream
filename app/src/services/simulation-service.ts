class SimulationService {
    private static instance: SimulationService;
    private constructor() {
        console.debug("SimulationService instance created");
    }
    public static getInstance(): SimulationService {
        if (!SimulationService.instance) {
            SimulationService.instance = new SimulationService();
        }
        return SimulationService.instance;
    }
}

export const simulationService = SimulationService.getInstance();