import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { ProfilingService } from './profiling.service';

@Injectable()
export class DataProfilingConsumerService implements OnModuleInit {
    private channelWrapper: ChannelWrapper;
    private readonly logger = new Logger(DataProfilingConsumerService.name);
    private readonly queue = process.env.DATA_PROFILING_RESULT_QUEUE || 'DATA_PROFILING_RESULT_QUEUE';

    constructor(private profilingService: ProfilingService) {
        const connection = amqp.connect([process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672']);
        this.channelWrapper = connection.createChannel();
    }

    public async onModuleInit() {
        try {
            await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
                await channel.assertQueue(this.queue, {durable: true});
                await channel.consume(this.queue, async (msg) => {
                    if (msg){
                        
                        try {
                            const payload = JSON.parse(msg.content.toString());
                            this.logger.log(`Received message from queue ${this.queue}: ${JSON.stringify(payload)}`);   
                            // Process the data profiling result
                            const { id, report } = payload;
                            await this.profilingService.updateDatasetProfilingData(id, report);
                            this.logger.log(`Processed data profiling result for dataset ID: ${id}`);
                        } catch (error) {
                            this.logger.error(`Error processing data profiling result: ${error.message}`, error.stack);
                        } finally {
                            channel.ack(msg); // Acknowledge the message
                        }
                    }
                });
            });
        } catch (error) {
            this.logger.error('Error starting the data profiling consumer:', error);
        }
    }
}
