/**
 * Google Drive → photos by George importer
 *
 * Setup:
 * 1. In Apps Script, open Project Settings › Script Properties.
 * 2. Add DRIVE_INGEST_TOKEN — set it to the same value as DRIVE_INGEST_TOKEN
 *    in your server's .env file. This value is sent in the x-drive-ingest-token
 *    request header.
 * 3. Run ingestPortfolioPhotos() manually whenever you want to import new images,
 *    or set a time-based trigger for automated imports.
 *
 * Folder model:
 * - ROOT_FOLDER_ID points at your designated Drive folder.
 * - Each immediate subfolder name becomes the portfolio category name/slug.
 *   If the category doesn't exist on the site yet it will be created automatically.
 * - Filenames beginning with "featured--", "hero--", or containing "[featured]"
 *   are marked as homepage favorites (slideshow).
 * - Already-imported files are skipped automatically (deduplication by Drive file ID).
 */

const ROOT_FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';
const INGEST_ENDPOINT = 'https://photosb-w00fwu0-preview-4200.runable.site/api/integrations/google-drive/ingest';

function ingestPortfolioPhotos() {
  const token = PropertiesService.getScriptProperties().getProperty('DRIVE_INGEST_TOKEN');
  if (!token) {
    throw new Error('Missing Script Property DRIVE_INGEST_TOKEN. Add it under Project Settings > Script Properties.');
  }

  Logger.log('Posting to endpoint: %s', INGEST_ENDPOINT);

  let root;
  try {
    root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  } catch (error) {
    throw new Error('Could not open ROOT_FOLDER_ID ' + ROOT_FOLDER_ID + ': ' + (error && error.message ? error.message : error));
  }

  const subfolders = root.getFolders();
  const totals = { imported: 0, skipped: 0, failed: 0 };

  while (subfolders.hasNext()) {
    const folder = subfolders.next();
    const sectionName = folder.getName();
    const sectionSlug = slugify(sectionName);
    const files = folder.getFiles();

    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();
      if (!mimeType || mimeType.indexOf('image/') !== 0) continue;

      try {
        const fileName = file.getName();
        const caption = captionFromFilename(fileName);
        const payload = {
          fileId: file.getId(),
          fileName: fileName,
          mimeType: mimeType,
          sectionName: sectionName,
          sectionSlug: sectionSlug,
          caption: caption,
          featured: isFeaturedFilename(fileName),
          dataBase64: Utilities.base64Encode(file.getBlob().getBytes()),
        };

        const response = UrlFetchApp.fetch(INGEST_ENDPOINT, {
          method: 'post',
          contentType: 'application/json',
          muteHttpExceptions: true,
          headers: {
            'x-drive-ingest-token': token,
          },
          payload: JSON.stringify(payload),
        });

        const status = response.getResponseCode();
        const body = response.getContentText();

        if (status >= 200 && status < 300) {
          let result = {};
          try { result = JSON.parse(body); } catch (e) {
            Logger.log('Warning %s: HTTP %s with non-JSON body: %s', fileName, status, body);
          }
          if (result.ok === false) {
            totals.failed += 1;
            Logger.log('FAILED [%s] %s → ok:false stage:%s detail:%s', sectionName, fileName, result.stage, result.detail);
          } else if (result.skipped) {
            totals.skipped += 1;
            Logger.log('Skipped (already imported) [%s] %s', sectionName, fileName);
          } else {
            totals.imported += 1;
            Logger.log('Imported [%s] %s → photoId:%s', sectionName, fileName, result.photoId);
          }
        } else {
          totals.failed += 1;
          Logger.log('FAILED [%s] %s → HTTP %s\n  body: %s', sectionName, fileName, status, body);
        }

      } catch (error) {
        totals.failed += 1;
        Logger.log('FAILED [%s] %s → exception: %s', sectionName, file.getName(), error && error.message ? error.message : error);
      }
    }
  }

  Logger.log('Done. Imported: %s  Skipped: %s  Failed: %s', totals.imported, totals.skipped, totals.failed);
  if (totals.failed > 0) {
    Logger.log('One or more files failed. Review the FAILED lines above for detail.');
  }
  return totals;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function captionFromFilename(fileName) {
  return String(fileName || '')
    .replace(/\.[^.]+$/, '')         // strip extension
    .replace(/\[featured\]/gi, '')   // strip [featured] tag
    .replace(/^(featured|hero)\s*--\s*/i, '')  // strip featured-- / hero-- prefix
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isFeaturedFilename(fileName) {
  return /\[featured\]/i.test(fileName) || /^(featured|hero)\s*--/i.test(fileName);
}
