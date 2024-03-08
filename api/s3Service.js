const {S3}=require('aws-sdk');


exports.s3Upload=async(file)=>
{
    const s3=new S3();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const params={
        Bucket:process.env.AWS_BUCKET_NAME,
        Key:`files/${uniqueSuffix}-${file.originalname}`,
        Body:file.buffer
    }
    return await s3.upload(params).promise();
}