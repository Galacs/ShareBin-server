import { S3Client } from '@aws-sdk/client-s3';

export const bucket = 'bucket';

// const client = new S3Client({
//   forcePathStyle: true,
//   endpoint: 'http://192.168.0.21.nip.io:30447',
//   tls: false,
//   region: 'my-store',
//   credentials: {
//     accessKeyId: 'K6RWV4P39Y1P4QTPW78P',
//     secretAccessKey: 'qRqDrH5OHTeGE8Q2AWImJS8ieGKk68CstrPF6a0L',
//   },
// });

export default new S3Client({
  forcePathStyle: true,
  endpoint: 'http://127.0.0.1:9000',
  tls: false,
  region: 'my-store',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
});
