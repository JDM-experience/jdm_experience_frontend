import { useState } from 'react';
import { Button, Input, Popconfirm, Space, Typography, Upload, message } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { ProductImage } from '@/components/common/ProductImage';
import { addTourImage, removeTourImage } from '@/services/tourService';
import { uploadTourImage } from '@/services/uploadService';
import { getErrorMessage } from '@/utils/errors';
import type { Tour } from '@/types/tour';
import { IMAGE_ACCEPT } from './constants';

/** Image gallery + uploader for an existing tour. Shared by the "Manage Images" and "Edit Tour" modals. */
export function TourImagesEditor({ tour, onChange }: { tour: Tour; onChange: () => void | Promise<void> }) {
  const [urlValue, setUrlValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>, fallback: string) {
    setBusy(true);
    try {
      await fn();
      await onChange();
    } catch (error) {
      message.error(getErrorMessage(error, fallback));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        {tour.images.length === 0 && <Typography.Text type="secondary">No images yet.</Typography.Text>}
        {tour.images.map((img) => (
          <div key={img.id} style={{ position: 'relative' }}>
            <ProductImage
              fileName={img.imageUrl}
              alt={tour.name}
              style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 4 }}
            />
            <Popconfirm
              title="Remove this image?"
              onConfirm={() => run(() => removeTourImage(tour.id, img.id), 'Unable to remove this image.')}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ position: 'absolute', top: -8, right: -8 }}
              />
            </Popconfirm>
          </div>
        ))}
      </Space>

      <Upload
        accept={IMAGE_ACCEPT}
        multiple
        showUploadList={false}
        beforeUpload={(file) => {
          void run(async () => {
            const imageUrl = await uploadTourImage(file);
            await addTourImage(tour.id, { imageUrl, sortOrder: tour.images.length });
          }, 'Unable to upload this image.');
          return Upload.LIST_IGNORE;
        }}
      >
        <Button icon={<UploadOutlined />} loading={busy}>
          Upload Image
        </Button>
      </Upload>

      <div>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
          …or add by URL
        </Typography.Text>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="https://example.com/tour.jpg"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
          />
          <Button
            type="primary"
            loading={busy}
            onClick={() => {
              const imageUrl = urlValue.trim();
              if (!imageUrl) return;
              void run(async () => {
                await addTourImage(tour.id, { imageUrl, sortOrder: tour.images.length });
                setUrlValue('');
              }, 'Unable to add this image.');
            }}
          >
            Add
          </Button>
        </Space.Compact>
      </div>
    </Space>
  );
}
