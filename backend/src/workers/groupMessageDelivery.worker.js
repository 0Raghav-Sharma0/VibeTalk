import { Worker } from "bullmq";

import { QUEUE_NAMES } from "../config/queues.js";

import { queueConfig } from "../config/queue.config.js";

import { getBullConnection } from "../infrastructure/redis/bullConnection.js";

import { groupPipelineService } from "../services/groupPipeline.service.js";



let worker = null;



export function startGroupMessageDeliveryWorker() {

  const connection = getBullConnection();

  if (!connection || worker) return null;



  worker = new Worker(

    QUEUE_NAMES.GROUP_MESSAGE_DELIVERY,

    async (job) => {

      const { message, memberIds } = job.data;

      groupPipelineService.fanOutToMembers(message, memberIds);

      return { status: "fanout", messageId: message._id, members: memberIds.length };

    },

    {

      connection,

      concurrency: queueConfig.concurrency.groupDelivery,

      limiter: { max: 500, duration: 1000 },

    }

  );



  worker.on("failed", (job, err) => {

    console.error(`❌ Group delivery failed [${job?.id}]:`, err.message);

  });



  console.log(

    `📬 Group delivery worker (concurrency=${queueConfig.concurrency.groupDelivery})`

  );

  return worker;

}



export async function stopGroupMessageDeliveryWorker() {

  if (worker) {

    await worker.close();

    worker = null;

  }

}


