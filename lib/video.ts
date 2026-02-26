/**
 * Convert a YouTube/Vimeo/Loom share URL into a privacy-preserving embed URL.
 * Returns null if the URL is not a recognised video host.
 */
export function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    // YouTube: youtube.com/watch?v=ID or youtu.be/ID
    if (host === 'youtube.com' || host === 'youtu.be') {
      const id =
        host === 'youtu.be'
          ? u.pathname.slice(1)
          : u.searchParams.get('v');
      if (!id) return null;
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
    }

    // Vimeo: vimeo.com/ID
    if (host === 'vimeo.com') {
      const id = u.pathname.slice(1);
      if (!id) return null;
      return `https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0`;
    }

    // Loom: loom.com/share/ID
    if (host === 'loom.com') {
      const id = u.pathname.replace('/share/', '').replace('/embed/', '');
      if (!id) return null;
      return `https://www.loom.com/embed/${id}?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`;
    }

    return null;
  } catch {
    return null;
  }
}
