import { useState } from 'react';
import { Button, Input, Modal, Popconfirm, Space, Typography, Upload, message } from 'antd';
import { DeleteOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons';
import { ProductImage, resolveSrc } from '@/components/common/ProductImage';
import { addTourImage, removeTourImage } from '@/services/tourService';
import { uploadTourImage } from '@/services/uploadService';
import { getErrorMessage } from '@/utils/errors';
import type { Tour, TourImage } from '@/types/tour';
import { IMAGE_ACCEPT } from './constants';
import { ImageCropGuide } from './ImageCropGuide';

/** Image gallery + uploader for an existing tour. Shared by the "Manage Images" and "Edit Tour" modals. */
export function TourImagesEditor({ tour, onChange }: { tour: Tour; onChange: () => void | Promise<void> }) {
  const [urlValue, setUrlValue] = useState('');
  const [busy, setBusy] = useState(false);
  // Which image the "how will this actually be cropped" preview is open for -- object-fit: cover
  // always crops from the center wherever this image is displayed, so this shows exactly what
  // survives that crop before the admin saves a photo where the important part gets cut off.
  const [previewTarget, setPreviewTarget] = useState<TourImage | null>(null);

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
              style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => setPreviewTarget(img)}
            />
            <Button
              size="small"
              icon={<EyeOutlined />}
              aria-label="Preview how this image will be cropped on the site"
              onClick={() => setPreviewTarget(img)}
              style={{ position: 'absolute', bottom: -8, left: -8 }}
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

      <Modal
        title="Image Crop Preview"
        open={previewTarget !== null}
        onCancel={() => setPreviewTarget(null)}
        footer={<Button onClick={() => setPreviewTarget(null)}>Close</Button>}
        width={480}
      >
        {previewTarget && (
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Images are always cropped from the center. The dimmed area below will be cut off —
              only the outlined area will actually be visible.
            </Typography.Paragraph>
            <ImageCropGuide
              src={resolveSrc(previewTarget.imageUrl)}
              alt={tour.name}
              ratio={1.4}
              label="Tours Grid Card"
              description="Shown on the Home page and the Tours listing."
            />
            <ImageCropGuide
              src={resolveSrc(previewTarget.imageUrl)}
              alt={tour.name}
              ratio={2.6}
              label="Featured Tours Hero (desktop)"
              description="Shown at the top of the Home page when this is one of the first 3 tours. Much wider than the card, so this crops more aggressively -- on mobile it's closer to the card's shape instead."
            />
          </Space>
        )}
      </Modal>
    </Space>
  );
}
