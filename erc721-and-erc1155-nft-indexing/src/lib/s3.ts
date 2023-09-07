import AWS from "aws-sdk";

let instance: AWS.S3 | null = null;

export function getS3(): AWS.S3 {
  if (!instance) {
    instance = new AWS.S3({
      region: process.env.AWS_REGION as string,
      credentials:
        process.env.S3_AWS_ACCESS_KEY_ID && process.env.S3_AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY,
            }
          : null,
      maxRetries: 5,
    });
  }

  return instance;
}

export async function saveToS3(
  bucket: string,
  key: string,
  content: string | Buffer,
  acl?: string,
  contentType?: string
) {
  const s3 = getS3();

  const result = await s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: content,
      ACL: acl,
      ContentType: contentType,
    })
    .promise();

  return {
    Bucket: result.Bucket,
    Key: result.Key,
  };
}

export async function saveToObjectIfLarge(contentJson: any, objectId: string) {
  let contentString = JSON.stringify(contentJson);

  if (contentString.length > 1_000) {
    if (!process.env.S3_LARGE_OBJECT_BUCKET_NAME) {
      throw new Error("env var S3_LARGE_OBJECT_BUCKET_NAME is not defined");
    }
    contentString = JSON.stringify({
      s3Reference: await saveToS3(
        process.env.S3_LARGE_OBJECT_BUCKET_NAME as string,
        `${objectId.replace(/-/gi, "/")}.json`,
        contentString
      ),
    });
  }

  return contentString;
}

export 
