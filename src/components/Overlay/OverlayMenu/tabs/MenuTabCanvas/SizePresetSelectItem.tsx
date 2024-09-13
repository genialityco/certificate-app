import { type ComponentPropsWithoutRef, forwardRef } from 'react'

import { Group, Text } from '@mantine/core'
import { IconBrandInstagram, IconQuestionMark } from '@tabler/icons-react'

function getSocialIcon(platformSlug: string) {
  const common = {
    size: 16,
  }

  switch (platformSlug) {
    case 'instagram':
      return <IconBrandInstagram {...common} />
    // case 'facebook':
    //   return <FaFacebook {...common} />;
    // case 'twitter':
    //   return <FaTwitter {...common} />;
    // case 'linkedin':
    //   return <FaLinkedin {...common} />;
    // case 'snapchat':
    //   return <FaSnapchatGhost {...common} />;
    // case 'youtube':
    //   return <FaYoutube {...common} />;
    // case 'pinterest':
    //   return <FaPinterest {...common} />;
    // case 'whatsapp':
    //   return <FaWhatsapp {...common} />;
    // case 'tiktok':
    //   return <BsTiktok {...common} />;
    // case 'reddit':
    //   return <BsReddit {...common} />;
    // case 'soundcloud':
    //   return <FaSoundcloud {...common} />;
    default:
      return <IconQuestionMark {...common} />
  }
}

interface SizePresetOption {
  platformSlug: string
  value: `${string}-${string}`
  label: string
  width: number
  height: number
}

type Props = SizePresetOption & ComponentPropsWithoutRef<'div'>

const SizePresetSelectItem = forwardRef<HTMLDivElement, Props>(
  ({ platformSlug, label, width, height, ...rest }: Props, ref) => (
    <div ref={ref} {...rest}>
      <Group>
        <div>{getSocialIcon(platformSlug)}</div>
        <div>
          <Text size="sm">{label}</Text>
          <Text size="xs" opacity={0.65}>
            {`${width} x ${height} px`}
          </Text>
        </div>
      </Group>
    </div>
  ),
)

SizePresetSelectItem.displayName = 'SizePresetSelectItem'

export type { SizePresetOption }
export default SizePresetSelectItem
