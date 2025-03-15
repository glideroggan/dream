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
    addTask(userProductId: string) {
        console.log(`SimulationService: Added simulation task for product ${userProductId}`);
        // throw new Error('Method not implemented.');
    }
}

export const simulationService = SimulationService.getInstance();