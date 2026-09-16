export class cleanupRegistry {

    private cleanupTasks: (() => Promise<void>)[] = [];

    register(task: () => Promise<void>): void {

        this.cleanupTasks.push(task);

    }

    async cleanupAll(): Promise<void> {

        console.log(
            `Starting cleanup of ${this.cleanupTasks.length} resource(s)`
        );

        for (const task of this.cleanupTasks.reverse()) {

            try {

                await task();

            } catch (error) {

                console.error(
                    'Cleanup failed:',
                    error
                );

            }

        }

    }

}
