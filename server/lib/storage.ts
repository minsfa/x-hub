/**
 * MinIO (S3 호환) 파일 업로드
 * Day 8: Phase 2-B
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
const bucket = process.env.MINIO_BUCKET ?? "xhub-reports";
const accessKey = process.env.MINIO_ROOT_USER ?? "minioadmin";
const secretKey = process.env.MINIO_ROOT_PASSWORD ?? "minioadmin";

const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
});

export async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

/**
 * 파일 업로드 후 URL 반환
 * 경로: {projectId}/{makerId}/{itemNumber}/{reportNo}/{fileName}
 */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  // 프록시 URL 반환 → 원격 접속(ngrok) 시에도 동작
  return `/api/files/${bucket}/${key}`;
}

/** 프록시용: MinIO에서 파일 스트림 가져오기 */
export async function getFileStream(
  bucketName: string,
  key: string
): Promise<{ body: NodeJS.ReadableStream; contentType?: string } | null> {
  try {
    const result = await s3.send(
      new GetObjectCommand({ Bucket: bucketName, Key: key })
    );
    return {
      body: result.Body as NodeJS.ReadableStream,
      contentType: result.ContentType ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}
