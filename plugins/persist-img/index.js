/**
 * Persists the generated img/ folder in the Netlify build cache so deploys
 * that don't touch assets/ skip the image rebuild entirely (the fingerprint
 * guard in scripts/build-images.mjs no-ops against the restored folder).
 */
export const onPreBuild = async ({ utils }) => {
    if (await utils.cache.restore('./img')) {
        console.log('Restored img/ from Netlify build cache.');
    } else {
        console.log('No cached img/ found — images will be fully rebuilt.');
    }
};

export const onPostBuild = async ({ utils }) => {
    await utils.cache.save('./img');
    console.log('Saved img/ to Netlify build cache.');
};
