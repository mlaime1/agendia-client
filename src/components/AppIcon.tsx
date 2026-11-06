import React from 'react';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconArrowsLeftRight,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconCoin,
  IconCopy,
  IconDots,
  IconDownload,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconFileText,
  IconInfoCircle,
  IconMail,
  IconMap,
  IconMapPin,
  IconMenu2,
  IconMessageCircle,
  IconNotes,
  IconPhone,
  IconPlus,
  IconReceipt,
  IconRefresh,
  IconSearch,
  IconSend,
  IconStar,
  IconTrash,
  IconUsers,
  IconUser,
  IconUserOff,
  IconX,
  type IconProps,
} from '@tabler/icons-react-native';

export type AppIconName =
  | 'alert'
  | 'arrowRight'
  | 'arrowsLeftRight'
  | 'back'
  | 'calendar'
  | 'check'
  | 'checkCircle'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'clock'
  | 'close'
  | 'closeCircle'
  | 'coin'
  | 'copy'
  | 'dots'
  | 'download'
  | 'edit'
  | 'eye'
  | 'eyeOff'
  | 'fileText'
  | 'info'
  | 'mail'
  | 'map'
  | 'mapPin'
  | 'menu'
  | 'message'
  | 'notes'
  | 'phone'
  | 'plus'
  | 'receipt'
  | 'refresh'
  | 'search'
  | 'send'
  | 'star'
  | 'trash'
  | 'user'
  | 'userOff'
  | 'users';

type AppIconProps = Omit<IconProps, 'name'> & {
  name: AppIconName;
};

const iconMap = {
  alert: IconAlertCircle,
  arrowRight: IconArrowRight,
  arrowsLeftRight: IconArrowsLeftRight,
  back: IconArrowLeft,
  calendar: IconCalendar,
  check: IconCheck,
  checkCircle: IconCircleCheck,
  chevronDown: IconChevronDown,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  clock: IconClock,
  close: IconX,
  closeCircle: IconCircleX,
  coin: IconCoin,
  copy: IconCopy,
  dots: IconDots,
  download: IconDownload,
  edit: IconEdit,
  eye: IconEye,
  eyeOff: IconEyeOff,
  fileText: IconFileText,
  info: IconInfoCircle,
  mail: IconMail,
  map: IconMap,
  mapPin: IconMapPin,
  menu: IconMenu2,
  message: IconMessageCircle,
  notes: IconNotes,
  phone: IconPhone,
  plus: IconPlus,
  receipt: IconReceipt,
  refresh: IconRefresh,
  search: IconSearch,
  send: IconSend,
  star: IconStar,
  trash: IconTrash,
  user: IconUser,
  userOff: IconUserOff,
  users: IconUsers,
} as const;

export function AppIcon({ name, size = 20, strokeWidth = 2, ...props }: AppIconProps) {
  const Icon = iconMap[name] ?? IconAlertCircle;

  return <Icon size={size} strokeWidth={strokeWidth} {...props} />;
}
